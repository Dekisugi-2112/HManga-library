"""
Chapters Service Module
=======================
Xử lý nghiệp vụ logic cho các chapters của truyện tranh.
Nhiệm vụ:
- Lấy danh sách chapters của bộ truyện.
- Tạo mới, cập nhật, xóa chapter.
- Thuật toán sinh tự động danh sách URL tất cả các trang ảnh dựa trên URL mẫu (`base_url`) và tổng số trang (`total_pages`).
- Tự động kích hoạt đồng bộ cache dữ liệu truyện.
"""

import re
from core.database import supabase
from modules.chapters.schemas import ChapterCreate, ChapterUpdate
from modules.comics.service import update_cache, resolve_comic_id

def get_chapters(comic_id):
    """
    Lấy danh sách toàn bộ các chapters thuộc về một bộ truyện (`comic_id`),
    sắp xếp theo thứ tự `chapter_number` tăng dần.
    """
    real_id = resolve_comic_id(comic_id)
    if real_id is None:
        return []
    response = supabase.table("chapters").select("*").eq("comic_id", real_id).order("chapter_number").execute()
    chapters = response.data or []
    for ch in chapters:
        s_page = ch.get("start_page", 1) or 1
        e_page = ch.get("end_page", ch.get("total_pages", 1)) or s_page
        ch["start_page"] = s_page
        ch["end_page"] = e_page
        ch["total_pages"] = max(1, e_page - s_page + 1)
    return chapters

def get_chapter_by_id(chapter_id: int):
    """
    Lấy thông tin của một chapter theo chapter_id.
    """
    response = supabase.table("chapters").select("*").eq("id", chapter_id).execute()
    if not response.data:
        return None
    ch = response.data[0]
    s_page = ch.get("start_page", 1) or 1
    e_page = ch.get("end_page", ch.get("total_pages", 1)) or s_page
    ch["start_page"] = s_page
    ch["end_page"] = e_page
    ch["total_pages"] = max(1, e_page - s_page + 1)
    return ch

def create_chapter(comic_id, chapter_data: ChapterCreate):
    """
    Tạo mới một chapter gắn liền với bộ truyện (`comic_id`).
    - Lưu start_page và end_page vào DB và cập nhật lại cache cục bộ.
    """
    real_id = resolve_comic_id(comic_id)
    if real_id is None:
        raise ValueError(f"Không tìm thấy bộ truyện với ID: {comic_id}")
    chapter_dict = chapter_data.dict()
    chapter_dict["comic_id"] = real_id
    response = supabase.table("chapters").insert(chapter_dict).execute()
    update_cache()
    new_ch = response.data[0]
    s_page = new_ch.get("start_page", 1) or 1
    e_page = new_ch.get("end_page", 1) or s_page
    new_ch["start_page"] = s_page
    new_ch["end_page"] = e_page
    new_ch["total_pages"] = max(1, e_page - s_page + 1)
    return new_ch

def update_chapter(chapter_id: int, chapter_data: ChapterUpdate):
    """
    Cập nhật thông tin của một chapter theo `chapter_id`.
    - Cập nhật các trường được truyền và cập nhật lại cache.
    """
    update_dict = {k: v for k, v in chapter_data.dict().items() if v is not None}
    response = supabase.table("chapters").update(update_dict).eq("id", chapter_id).execute()
    update_cache()
    if not response.data:
        return None
    ch = response.data[0]
    s_page = ch.get("start_page", 1) or 1
    e_page = ch.get("end_page", 1) or s_page
    ch["start_page"] = s_page
    ch["end_page"] = e_page
    ch["total_pages"] = max(1, e_page - s_page + 1)
    return ch

def delete_chapter(chapter_id: int):
    """
    Xóa một chapter khỏi database và làm mới cache.
    """
    supabase.table("chapters").delete().eq("id", chapter_id).execute()
    update_cache()

def generate_pages(chapter_id: int):
    """
    Tự động tạo danh sách toàn bộ URL ảnh đọc truyện (từ trang start_page -> end_page).
    
    Cơ chế:
    - Phân tích chuỗi số thứ tự và phần đuôi file từ `base_url` bằng Regular Expression (Regex).
      Ví dụ URL mẫu: 'https://i3.hentaifox.com/004/4029076/1.jpg' hoặc '1t.jpg'
      -> Tách prefix: 'https://i3.hentaifox.com/004/4029076/'
      -> Tách suffix: '.jpg' hoặc 't.jpg'
    - Tạo vòng lặp từ `start_page` đến `end_page` để ráp thành danh sách đầy đủ.
    """
    response = supabase.table("chapters").select("*").eq("id", chapter_id).execute()
    if not response.data:
        return []
        
    chapter = response.data[0]
    base_url = chapter.get("base_url", "")
    start_page = int(chapter.get("start_page") or 1)
    # Dự phòng lấy total_pages nếu bản ghi cũ chưa cập nhật end_page
    end_page = int(chapter.get("end_page") or chapter.get("total_pages") or start_page)
    
    if end_page < start_page:
        end_page = start_page

    total_count = end_page - start_page + 1
    
    # Regex tìm số trang và phần đuôi ở cuối URL: VD: /1t.jpg hoặc /1.jpg
    match = re.search(r'/(\d+)([^/]*\.\w+)$', base_url)
    if not match:
        # Dự phòng nếu đường link không tuân theo quy tắc thông thường
        return [base_url] * total_count
        
    prefix = base_url[:match.start(1)]
    suffix = match.group(2)
    
    # Loại bỏ tiền tố 't' trong đuôi file (VD: 't.jpg' -> '.jpg') để tải ảnh gốc Full HD cực nét khi đọc
    clean_suffix = re.sub(r'^t\.', '.', suffix, flags=re.IGNORECASE)
    
    # Sinh danh sách các URL trang ảnh hoàn chỉnh từ start_page đến end_page với chất lượng gốc cao nhất
    return [f"{prefix}{i}{clean_suffix}" for i in range(start_page, end_page + 1)]
