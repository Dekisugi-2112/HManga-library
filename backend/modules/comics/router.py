"""
Comics Router Module
====================
Cung cấp các API endpoints liên quan đến tài nguyên truyện tranh (/api/comics).
Nhiệm vụ:
- GET /api/comics: Lấy danh sách truyện có hỗ trợ tìm kiếm / lọc.
- GET /api/comics/{comic_id}: Lấy chi tiết một bộ truyện kèm chapters.
- POST /api/comics: Thêm mới bộ truyện vào thư viện.
- PUT /api/comics/{comic_id}: Chỉnh sửa thông tin bộ truyện.
- DELETE /api/comics/{comic_id}: Xóa bỏ bộ truyện khỏi thư viện.
- GET /api/comics/check/{gallery_id}: Kiểm tra bộ truyện đã tồn tại chưa qua gallery_id.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from modules.comics.schemas import ComicCreate, ComicUpdate, ComicResponse, ComicDetailResponse
import modules.comics.service as service

router = APIRouter(prefix="/api/comics", tags=["comics"])

@router.get("", response_model=List[ComicResponse])
def get_comics(tag: Optional[str] = None, q: Optional[str] = None):
    """Lấy danh sách tất cả các bộ truyện, có thể lọc theo tag hoặc từ khóa tìm kiếm"""
    return service.get_all_comics(tag=tag, q=q)

@router.get("/{comic_id}", response_model=ComicDetailResponse)
def get_comic(comic_id: int):
    """Lấy thông tin chi tiết một bộ truyện cụ thể kèm danh sách các chapters"""
    comic = service.get_comic_detail(comic_id)
    if not comic:
        raise HTTPException(status_code=404, detail="Comic not found")
    return comic

@router.post("", response_model=ComicDetailResponse)
def create_comic(comic: ComicCreate):
    """Thêm mới một bộ truyện vào thư viện"""
    return service.create_comic(comic)

@router.put("/{comic_id}", response_model=ComicDetailResponse)
def update_comic(comic_id: int, comic: ComicUpdate):
    """Cập nhật thông tin tiêu đề, tác giả, tags, ghi chú của bộ truyện"""
    updated = service.update_comic(comic_id, comic)
    if not updated:
        raise HTTPException(status_code=404, detail="Comic not found")
    return updated

@router.delete("/{comic_id}")
def delete_comic(comic_id: int):
    """Xóa bộ truyện và toàn bộ chapters, tags liên kết cùng ảnh bìa"""
    service.delete_comic(comic_id)
    return {"message": "Comic deleted successfully"}

@router.get("/check/{gallery_id}")
def check_comic_exists(gallery_id: str):
    """Kiểm tra truyện đã tồn tại theo gallery_id từ hentaifox"""
    comic = service.check_comic_by_gallery_id(gallery_id)
    if comic:
        return {"exists": True, "comic": comic}
    return {"exists": False}
