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
from modules.comics.service import update_cache

def get_chapters(comic_id: int):
    """
    Lấy danh sách toàn bộ các chapters thuộc về một bộ truyện (`comic_id`),
    sắp xếp theo thứ tự `chapter_number` tăng dần.
    """
    response = supabase.table("chapters").select("*").eq("comic_id", comic_id).order("chapter_number").execute()
    return response.data

def create_chapter(comic_id: int, chapter_data: ChapterCreate):
    """
    Tạo mới một chapter gắn liền với bộ truyện (`comic_id`).
    - Lưu vào DB và cập nhật lại cache cục bộ.
    """
    chapter_dict = chapter_data.dict()
    chapter_dict["comic_id"] = comic_id
    response = supabase.table("chapters").insert(chapter_dict).execute()
    update_cache()
    return response.data[0]

def update_chapter(chapter_id: int, chapter_data: ChapterUpdate):
    """
    Cập nhật thông tin của một chapter theo `chapter_id`.
    - Cập nhật các trường được truyền và cập nhật lại cache.
    """
    update_dict = {k: v for k, v in chapter_data.dict().items() if v is not None}
    response = supabase.table("chapters").update(update_dict).eq("id", chapter_id).execute()
    update_cache()
    return response.data[0] if response.data else None

def delete_chapter(chapter_id: int):
    """
    Xóa một chapter khỏi database và làm mới cache.
    """
    supabase.table("chapters").delete().eq("id", chapter_id).execute()
    update_cache()

def generate_pages(chapter_id: int):
    """
    Tự động tạo danh sách toàn bộ URL ảnh đọc truyện (từ trang 1 -> total_pages).
    
    Cơ chế:
    - Phân tích chuỗi số thứ tự và phần đuôi file từ `base_url` bằng Regular Expression (Regex).
      Ví dụ URL mẫu: 'https://i3.hentaifox.com/004/4029076/1.jpg' hoặc '1t.jpg'
      -> Tách prefix: 'https://i3.hentaifox.com/004/4029076/'
      -> Tách suffix: '.jpg' hoặc 't.jpg'
    - Tạo vòng lặp từ 1 đến `total_pages` để ráp thành danh sách đầy đủ.
    """
    response = supabase.table("chapters").select("base_url, total_pages").eq("id", chapter_id).execute()
    if not response.data:
        return []
        
    chapter = response.data[0]
    base_url = chapter["base_url"]
    total_pages = chapter["total_pages"]
    
    # Regex tìm số trang và phần đuôi ở cuối URL: VD: /1t.jpg hoặc /1.jpg
    match = re.search(r'/(\d+)([^/]*\.\w+)$', base_url)
    if not match:
        # Dự phòng nếu đường link không tuân theo quy tắc thông thường
        return [base_url] * total_pages
        
    prefix = base_url[:match.start(1)]
    suffix = match.group(2)
    
    # Sinh danh sách các URL trang ảnh hoàn chỉnh
    return [f"{prefix}{i}{suffix}" for i in range(1, total_pages + 1)]
