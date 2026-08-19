"""
Authors Service Module
======================
Xử lý logic nghiệp vụ liên quan đến quản lý Tác giả (Authors):
1. Lấy danh sách tất cả các tác giả có trong thư viện và đếm số lượng tác phẩm.
2. Đổi tên tác giả hàng loạt (cập nhật cột `author` của tất cả các bộ truyện liên quan).
3. Lấy danh sách toàn bộ các bộ truyện của một tác giả cụ thể.
"""

from core.database import supabase
from modules.comics.service import update_cache

def get_all_authors():
    """
    Lấy danh sách tất cả các tác giả có trong database:
    1. Truy vấn các dòng có cột `author` không rỗng từ bảng `comics`.
    2. Đếm số lượng truyện của từng tác giả (tập hợp theo tên tác giả).
    3. Sắp xếp danh sách tác giả theo thứ tự bảng chữ cái A-Z.
    4. Trả về danh sách: [{ name: "Tên tác giả", comic_count: 5 }, ...]
    """
    try:
        res = supabase.table("comics").select("id, author").not_.is_("author", "null").execute()
        comics = res.data or []
        
        count_map = {}
        for c in comics:
            author = (c.get("author") or "").strip()
            if author:
                count_map[author] = count_map.get(author, 0) + 1
                
        authors = [{"name": name, "comic_count": count} for name, count in count_map.items()]
        authors.sort(key=lambda x: x["name"].lower())
        return authors
    except Exception as e:
        print(f"[Warning] Error querying authors: {e}")
        return []

def rename_author(old_name: str, new_name: str):
    """
    Đổi tên tác giả hàng loạt:
    - Tìm tất cả các bộ truyện trong bảng `comics` có `author = old_name`.
    - Cập nhật đồng loạt thành `author = new_name`.
    - Đồng bộ lại cache JSON.
    - Trả về số lượng bộ truyện đã được cập nhật (`updated_count`).
    """
    clean_old = old_name.strip()
    clean_new = new_name.strip()
    if not clean_old or not clean_new:
        return {"updated_count": 0}
        
    try:
        res = supabase.table("comics").update({"author": clean_new}).eq("author", clean_old).execute()
        updated_count = len(res.data or [])
        update_cache()
        return {"updated_count": updated_count, "new_name": clean_new}
    except Exception as e:
        print(f"[Error] Error renaming author: {e}")
        return {"updated_count": 0, "error": str(e)}

def get_comics_by_author(author_name: str):
    """
    Lấy danh sách toàn bộ các bộ truyện thuộc về một tác giả:
    1. Truy vấn bảng `comics` theo tên tác giả (`author = author_name`).
    2. Lấy danh sách thể loại của các bộ truyện này từ bảng `comic_genres`.
    3. Gắn thể loại vào từng bộ truyện và trả về danh sách hoàn chỉnh.
    """
    clean_author = author_name.strip()
    try:
        # 1. Truy vấn các truyện của tác giả
        res = supabase.table("comics").select("*").eq("author", clean_author).order("id", desc=False).execute()
        comics = res.data or []
        
        comic_ids = [c["id"] for c in comics]
        if not comic_ids:
            return []
            
        # 2. Lấy danh sách thể loại của các truyện này
        genres_map = {}
        try:
            genres_res = supabase.table("comic_genres").select("comic_id, genres(name)").in_("comic_id", comic_ids).execute()
            for item in genres_res.data or []:
                c_id = item["comic_id"]
                g_name = item["genres"]["name"]
                if c_id not in genres_map:
                    genres_map[c_id] = []
                genres_map[c_id].append(g_name)
        except Exception as ge:
            print(f"[Warning] Error querying genres in get_comics_by_author: {ge}")
            
        # 3. Gắn danh sách thể loại vào từng truyện
        for c in comics:
            c["genres"] = genres_map.get(c["id"], [])
            
        return comics
    except Exception as e:
        print(f"[Error] Error get_comics_by_author: {e}")
        return []
