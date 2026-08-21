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
from modules.images.schemas import DownloadCoverRequest

router = APIRouter(prefix="/api/images", tags=["images"])

@router.post("/download-cover")
async def download_cover(request: DownloadCoverRequest):
    """API tải ảnh bìa về máy chủ và lưu tên file vào thông tin bộ truyện"""
    return await service.download_cover(request.url, request.comic_id)
