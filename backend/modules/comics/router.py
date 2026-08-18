from fastapi import APIRouter, HTTPException
from typing import List, Optional
from modules.comics.schemas import ComicCreate, ComicUpdate, ComicResponse, ComicDetailResponse
import modules.comics.service as service

router = APIRouter(prefix="/api/comics", tags=["comics"])

@router.get("", response_model=List[ComicResponse])
def get_comics(status: Optional[str] = None, tag: Optional[str] = None, q: Optional[str] = None):
    return service.get_all_comics(status=status, tag=tag, q=q)

@router.get("/{comic_id}", response_model=ComicDetailResponse)
def get_comic(comic_id: int):
    comic = service.get_comic_detail(comic_id)
    if not comic:
        raise HTTPException(status_code=404, detail="Comic not found")
    return comic

@router.post("", response_model=ComicDetailResponse)
def create_comic(comic: ComicCreate):
    return service.create_comic(comic)

@router.put("/{comic_id}", response_model=ComicDetailResponse)
def update_comic(comic_id: int, comic: ComicUpdate):
    updated = service.update_comic(comic_id, comic)
    if not updated:
        raise HTTPException(status_code=404, detail="Comic not found")
    return updated

@router.delete("/{comic_id}")
def delete_comic(comic_id: int):
    service.delete_comic(comic_id)
    return {"message": "Comic deleted successfully"}

@router.get("/check/{gallery_id}")
def check_comic_exists(gallery_id: str):
    """Kiểm tra truyện đã tồn tại theo gallery_id"""
    comic = service.check_comic_by_gallery_id(gallery_id)
    if comic:
        return {"exists": True, "comic": comic}
    return {"exists": False}
