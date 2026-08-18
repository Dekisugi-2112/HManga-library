from fastapi import APIRouter, HTTPException
from typing import List
from modules.chapters.schemas import ChapterCreate, ChapterUpdate, ChapterResponse
import modules.chapters.service as service

router = APIRouter()

@router.get("/api/comics/{comic_id}/chapters", response_model=List[ChapterResponse], tags=["chapters"])
def get_chapters(comic_id: int):
    return service.get_chapters(comic_id)

@router.post("/api/comics/{comic_id}/chapters", response_model=ChapterResponse, tags=["chapters"])
def create_chapter(comic_id: int, chapter: ChapterCreate):
    return service.create_chapter(comic_id, chapter)

@router.put("/api/chapters/{chapter_id}", response_model=ChapterResponse, tags=["chapters"])
def update_chapter(chapter_id: int, chapter: ChapterUpdate):
    updated = service.update_chapter(chapter_id, chapter)
    if not updated:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return updated

@router.delete("/api/chapters/{chapter_id}", tags=["chapters"])
def delete_chapter(chapter_id: int):
    service.delete_chapter(chapter_id)
    return {"message": "Chapter deleted successfully"}

@router.get("/api/chapters/{chapter_id}/pages", response_model=List[str], tags=["chapters"])
def get_chapter_pages(chapter_id: int):
    pages = service.generate_pages(chapter_id)
    if not pages:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return pages
