"""
Chapters Router Module
======================
Cung cấp các API endpoints liên quan đến Chapters và danh sách trang truyện.
Nhiệm vụ:
- GET /api/comics/{comic_id}/chapters: Lấy danh sách chapter của một truyện.
- POST /api/comics/{comic_id}/chapters: Thêm chapter mới cho truyện.
- PUT /api/chapters/{chapter_id}: Chỉnh sửa thông tin chapter.
- DELETE /api/chapters/{chapter_id}: Xóa chapter.
- GET /api/chapters/{chapter_id}/pages: Lấy danh sách toàn bộ URL ảnh các trang của chapter.
"""

from fastapi import APIRouter, HTTPException
from typing import List
from modules.chapters.schemas import ChapterCreate, ChapterUpdate, ChapterResponse
import modules.chapters.service as service

router = APIRouter()

@router.get("/api/comics/{comic_id}/chapters", response_model=List[ChapterResponse], tags=["chapters"])
def get_chapters(comic_id: str):
    """Lấy toàn bộ danh sách các chapters của một bộ truyện theo ID hoặc gallery_id"""
    return service.get_chapters(comic_id)

@router.post("/api/comics/{comic_id}/chapters", response_model=ChapterResponse, tags=["chapters"])
def create_chapter(comic_id: str, chapter: ChapterCreate):
    """Tạo mới một chapter cho bộ truyện theo ID hoặc gallery_id"""
    return service.create_chapter(comic_id, chapter)

@router.put("/api/chapters/{chapter_id}", response_model=ChapterResponse, tags=["chapters"])
def update_chapter(chapter_id: int, chapter: ChapterUpdate):
    """Cập nhật thông tin của một chapter"""
    updated = service.update_chapter(chapter_id, chapter)
    if not updated:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return updated

@router.delete("/api/chapters/{chapter_id}", tags=["chapters"])
def delete_chapter(chapter_id: int):
    """Xóa bỏ một chapter khỏi hệ thống"""
    service.delete_chapter(chapter_id)
    return {"message": "Chapter deleted successfully"}

@router.get("/api/chapters/{chapter_id}/pages", response_model=List[str], tags=["chapters"])
def get_chapter_pages(chapter_id: int):
    """Tự động sinh và trả về danh sách tất cả URL các trang ảnh của chapter để trình đọc hiển thị"""
    pages = service.generate_pages(chapter_id)
    if not pages:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return pages
