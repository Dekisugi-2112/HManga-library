"""
Comics Service Module
=====================
Xử lý toàn bộ nghiệp vụ CRUD và logic liên quan đến truyện tranh (Comics).
Nhiệm vụ:
- Lấy danh sách truyện có hỗ trợ lọc theo tiêu đề hoặc thẻ tags.
- Xem thông tin chi tiết của bộ truyện kèm danh sách chapters và tags.
- Tạo mới truyện, tự động kiểm tra và thêm các tags vào cơ sở dữ liệu.
- Cập nhật thông tin truyện và tags liên kết.
- Xóa truyện kèm dọn dẹp chapters, tags và file ảnh bìa cục bộ.
- Kiểm tra trùng lặp truyện dựa theo gallery_id từ hentaifox.
- Đồng bộ và cập nhật file cache cục bộ (cache/comics_cache.json).
"""

import json
from pathlib import Path
from core.database import supabase
from modules.comics.schemas import ComicCreate, ComicUpdate

# Đường dẫn đến file lưu trữ cache truyện cục bộ
CACHE_DIR = Path(__file__).parent.parent.parent / "cache"
CACHE_FILE = CACHE_DIR / "comics_cache.json"

def get_all_comics(tag: str = None, q: str = None):
    """
    Lấy danh sách tất cả các bộ truyện trong thư viện.
    - Sắp xếp theo ID tăng dần (1, 2, 3...).
    - Hỗ trợ lọc theo từ khóa tìm kiếm trong tiêu đề `q`.
    - Hỗ trợ lọc theo tên tag `tag`.
    - Tự động map danh sách tags từ bảng comic_tags cho từng bộ truyện.
    """
    # Truy vấn bảng comics theo thứ tự ID tăng dần
    query = supabase.table("comics").select("*").order("id", desc=False)
    if q:
        query = query.ilike("title", f"%{q}%")
    
    response = query.execute()
    comics = response.data
    
    # Lấy danh sách ID truyện để truy vấn tags tương ứng theo lô (batch query)
    comic_ids = [c["id"] for c in comics]
    if not comic_ids:
        return []
        
    tags_response = supabase.table("comic_tags").select("comic_id, tags(name)").in_("comic_id", comic_ids).execute()
    tags_map = {}
    for item in tags_response.data:
        c_id = item["comic_id"]
        tag_name = item["tags"]["name"]
        if c_id not in tags_map:
            tags_map[c_id] = []
        tags_map[c_id].append(tag_name)
        
    # Gắn danh sách tags vào từng object truyện và lọc theo tag nếu có yêu cầu
    result = []
    for comic in comics:
        comic["tags"] = tags_map.get(comic["id"], [])
        if tag and tag not in comic["tags"]:
            continue
        result.append(comic)
        
    return result

def get_comic_detail(comic_id: int):
    """
    Lấy chi tiết một bộ truyện theo ID:
    - Trả về thông tin truyện.
    - Trả về danh sách tags đi kèm.
    - Trả về danh sách chapters đã sắp xếp theo số thứ tự chapter_number.
    """
    response = supabase.table("comics").select("*").eq("id", comic_id).execute()
    if not response.data:
        return None
    comic = response.data[0]
    
    # Truy vấn danh sách tags của bộ truyện
    tags_response = supabase.table("comic_tags").select("tags(name)").eq("comic_id", comic_id).execute()
    comic["tags"] = [item["tags"]["name"] for item in tags_response.data]
    
    # Truy vấn danh sách các chapters của bộ truyện
    chapters_response = supabase.table("chapters").select("*").eq("comic_id", comic_id).order("chapter_number").execute()
    comic["chapters"] = chapters_response.data
    
    return comic

def create_comic(comic_data: ComicCreate):
    """
    Tạo mới một bộ truyện:
    1. Kiểm tra từng tag, nếu chưa có trong DB thì tự động tạo mới vào bảng `tags`.
    2. Chèn thông tin truyện vào bảng `comics`.
    3. Gắn liên kết truyện và tags vào bảng trung gian `comic_tags`.
    4. Cập nhật lại file cache cục bộ.
    """
    # 1. Xử lý và lấy tag_ids (tạo mới tag nếu chưa tồn tại)
    tag_ids = []
    for tag_name in comic_data.tags:
        tag_res = supabase.table("tags").select("id").eq("name", tag_name).execute()
        if not tag_res.data:
            new_tag = supabase.table("tags").insert({"name": tag_name}).execute()
            tag_ids.append(new_tag.data[0]["id"])
        else:
            tag_ids.append(tag_res.data[0]["id"])
            
    # 2. Thêm truyện vào bảng comics
    comic_dict = comic_data.dict(exclude={"tags"})
    response = supabase.table("comics").insert(comic_dict).execute()
    new_comic = response.data[0]
    
    # 3. Thêm liên kết vào bảng comic_tags
    for tag_id in tag_ids:
        supabase.table("comic_tags").insert({"comic_id": new_comic["id"], "tag_id": tag_id}).execute()
        
    # Cập nhật cache và trả về chi tiết truyện vừa tạo
    update_cache()
    return get_comic_detail(new_comic["id"])

def update_comic(comic_id: int, comic_data: ComicUpdate):
    """
    Cập nhật thông tin của một bộ truyện theo ID:
    - Cập nhật các trường thông tin cơ bản nếu có truyền vào.
    - Làm mới danh sách tags trong bảng `comic_tags` nếu danh sách tags được cung cấp.
    - Cập nhật lại cache cục bộ.
    """
    comic_dict = {k: v for k, v in comic_data.dict(exclude={"tags"}).items() if v is not None}
    if comic_dict:
        supabase.table("comics").update(comic_dict).eq("id", comic_id).execute()
    
    # Cập nhật lại danh sách tags nếu có
    if comic_data.tags is not None:
        # Xóa các liên kết tags cũ
        supabase.table("comic_tags").delete().eq("comic_id", comic_id).execute()
        tag_ids = []
        for tag_name in comic_data.tags:
            tag_res = supabase.table("tags").select("id").eq("name", tag_name).execute()
            if not tag_res.data:
                new_tag = supabase.table("tags").insert({"name": tag_name}).execute()
                tag_ids.append(new_tag.data[0]["id"])
            else:
                tag_ids.append(tag_res.data[0]["id"])
                
        for tag_id in tag_ids:
            supabase.table("comic_tags").insert({"comic_id": comic_id, "tag_id": tag_id}).execute()
        
    update_cache()
    return get_comic_detail(comic_id)

def delete_comic(comic_id: int):
    """
    Xóa bộ truyện khỏi hệ thống:
    1. Tìm tên file ảnh bìa (cover_filename).
    2. Xóa các chapters thuộc bộ truyện.
    3. Xóa các liên kết tags trong `comic_tags`.
    4. Xóa bản ghi trong bảng `comics`.
    5. Xóa file ảnh bìa vật lý trong thư mục `cover-images/` nếu tồn tại.
    6. Cập nhật lại cache cục bộ.
    """
    comic_res = supabase.table("comics").select("cover_filename").eq("id", comic_id).execute()
    cover_filename = comic_res.data[0]["cover_filename"] if comic_res.data else None
    
    # Xóa dữ liệu liên quan trong database
    supabase.table("chapters").delete().eq("comic_id", comic_id).execute()
    supabase.table("comic_tags").delete().eq("comic_id", comic_id).execute()
    supabase.table("comics").delete().eq("id", comic_id).execute()
    
    # Xóa file ảnh bìa trên ổ đĩa
    if cover_filename:
        cover_path = Path(__file__).parent.parent.parent.parent / "cover-images" / cover_filename
        if cover_path.exists():
            cover_path.unlink()
    
    update_cache()

def check_comic_by_gallery_id(gallery_id: str):
    """
    Kiểm tra xem một bộ truyện đã từng được thêm vào thư viện hay chưa
    thông qua ID gallery của hentaifox (VD: 4029076).
    - Dựa vào việc tìm chuỗi `/{gallery_id}/` trong trường source_url.
    - Trả về object truyện nếu đã có, hoặc None nếu chưa có.
    """
    response = supabase.table("comics").select("*").ilike("source_url", f"%/{gallery_id}/%").execute()
    if response.data:
        comic = response.data[0]
        tags_response = supabase.table("comic_tags").select("tags(name)").eq("comic_id", comic["id"]).execute()
        comic["tags"] = [item["tags"]["name"] for item in tags_response.data]
        chapters_response = supabase.table("chapters").select("*").eq("comic_id", comic["id"]).order("chapter_number").execute()
        comic["chapters"] = chapters_response.data
        return comic
    return None

def update_cache():
    """
    Tạo hoặc làm mới file cache JSON (`cache/comics_cache.json`).
    Lưu toàn bộ danh sách truyện kèm chapters và tags để có thể truy xuất offline/nhanh chóng khi cần.
    """
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    comics = get_all_comics()
    for comic in comics:
        chapters = supabase.table("chapters").select("*").eq("comic_id", comic["id"]).order("chapter_number").execute()
        comic["chapters"] = chapters.data
        
    from datetime import datetime
    cache_data = {
        "comics": comics,
        "last_updated": datetime.utcnow().isoformat() + "Z"
    }
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, ensure_ascii=False, indent=2)
