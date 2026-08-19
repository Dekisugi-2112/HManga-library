"""
Search Service Module
=====================
Xử lý logic tìm kiếm và lọc truyện tranh kết hợp nhiều tiêu chí:
- Tìm kiếm theo từ khóa trong tiêu đề (`q`).
- Lọc theo tên tác giả (`author`).
- Lọc theo thể loại (`genre`).
"""

from core.database import supabase

def search_comics(q: str = None, genre: str = None, author: str = None):
    """
    Tìm kiếm và lọc danh sách truyện nâng cao:
    1. Lọc bảng `comics` theo tên tác giả và từ khóa tiêu đề (không phân biệt hoa thường).
    2. Truy vấn danh sách thể loại từ bảng trung gian `comic_genres` cho các truyện tìm được.
    3. Lọc tiếp theo thể loại nếu tham số `genre` được cung cấp.
    4. Trả về danh sách truyện thỏa mãn tất cả các điều kiện.
    """
    # 1. Khởi tạo truy vấn cơ bản từ bảng comics
    query = supabase.table("comics").select("id, title, author, cover_filename").order("id", desc=False)
    
    # Lọc theo tên tác giả nếu có
    if author:
        query = query.ilike("author", f"%{author}%")
    # Lọc theo tên truyện nếu có
    if q:
        query = query.ilike("title", f"%{q}%")
        
    response = query.execute()
    comics = response.data or []
    
    if not comics:
        return []
        
    # 2. Lấy danh sách thể loại của các bộ truyện tìm được
    comic_ids = [c["id"] for c in comics]
    genres_map = {}
    try:
        genres_response = supabase.table("comic_genres").select("comic_id, genres(name)").in_("comic_id", comic_ids).execute()
        for item in genres_response.data or []:
            c_id = item["comic_id"]
            genre_name = item["genres"]["name"]
            if c_id not in genres_map:
                genres_map[c_id] = []
            genres_map[c_id].append(genre_name)
    except Exception as e:
        print(f"[Warning] Error querying comic_genres in search: {e}")
        
    # 3. Gắn thể loại vào từng bộ truyện và lọc theo thể loại nếu có yêu cầu
    result = []
    for comic in comics:
        comic["genres"] = genres_map.get(comic["id"], [])
        if genre and genre not in comic["genres"]:
            continue
        result.append(comic)
        
    return result
