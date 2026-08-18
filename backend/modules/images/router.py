"""
Images Router Module
====================
Cung cấp các API endpoints liên quan đến tải và xử lý hình ảnh (/api/images).
Nhiệm vụ:
- POST /api/images/download-cover: Tiếp nhận URL ảnh bìa và ID bộ truyện để tiến hành tải về local server.
"""

from fastapi import APIRouter
from pydantic import BaseModel
import modules.images.service as service

router = APIRouter(prefix="/api/images", tags=["images"])

class DownloadCoverRequest(BaseModel):
    """
    Schema yêu cầu tải ảnh bìa:
    - url: Link ảnh bìa từ nguồn (hentaifox)
    - comic_id: ID của bộ truyện cần gán ảnh bìa
    """
    url: str
    comic_id: int

@router.post("/download-cover")
async def download_cover(request: DownloadCoverRequest):
    """API tải ảnh bìa về máy chủ và lưu tên file vào thông tin bộ truyện"""
    return await service.download_cover(request.url, request.comic_id)
