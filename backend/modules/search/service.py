"""
Search Service Module
=====================
Xử lý logic tìm kiếm và lọc dữ liệu nâng cao cho truyện tranh.
Nhiệm vụ:
- Tìm kiếm kết hợp theo nhiều tiêu chí đồng thời: tên truyện (`q`), tên tác giả (`author`), và thể loại (`tag`).
- Tối ưu truy vấn bằng cách lọc `ilike` trên Postgres và gom nhóm tags hiệu quả.
"""

from core.database import supabase

def search_comics(q: str = None, tag: str = None, author: str = None):
    """
    Thực hiện tìm kiếm truyện nâng cao theo nhiều tiêu chí kết hợp:
    - `q`: Từ khóa tìm kiếm không phân biệt hoa thường trong tiêu đề (`title`).
    - `author`: Tên tác giả / artist (`author`).
    - `tag`: Thể loại / nhãn gắn với truyện (`tag`).
    
    Quy trình:
    1. Truy vấn các trường cần thiết từ bảng `comics`.
    2. Áp dụng các bộ lọc tác giả và từ khóa tiêu đề nếu có.
    3. Lấy danh sách tags liên kết từ bảng `comic_tags` và map vào từng bộ truyện.
    4. Lọc kết quả theo `tag` nếu người dùng yêu cầu.
    """
    query = supabase.table("comics").select("id, title, author, cover_filename, updated_at").order("id", desc=False)
    
    if author:
        query = query.ilike("author", f"%{author}%")
    if q:
        query = query.ilike("title", f"%{q}%")
        
    response = query.execute()
    comics = response.data
    
    if not comics:
        return []
        
    # Xử lý lấy danh sách tags cho các bộ truyện tìm được
    comic_ids = [c["id"] for c in comics]
    tags_response = supabase.table("comic_tags").select("comic_id, tags(name)").in_("comic_id", comic_ids).execute()
    
    tags_map = {}
    for item in tags_response.data:
        c_id = item["comic_id"]
        tag_name = item["tags"]["name"]
        if c_id not in tags_map:
            tags_map[c_id] = []
        tags_map[c_id].append(tag_name)
        
    result = []
    for comic in comics:
        comic["tags"] = tags_map.get(comic["id"], [])
        if tag and tag not in comic["tags"]:
            continue
        result.append(comic)
        
    return result
