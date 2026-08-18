from fastapi import APIRouter
from pydantic import BaseModel
import modules.images.service as service

router = APIRouter(prefix="/api/images", tags=["images"])

class DownloadCoverRequest(BaseModel):
    url: str
    comic_id: int

@router.post("/download-cover")
async def download_cover(request: DownloadCoverRequest):
    return await service.download_cover(request.url, request.comic_id)
