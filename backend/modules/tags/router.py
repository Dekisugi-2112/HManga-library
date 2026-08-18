from fastapi import APIRouter, HTTPException
from typing import List
from modules.tags.schemas import TagCreate, TagUpdate, TagResponse
from modules.comics.schemas import ComicResponse
import modules.tags.service as service

router = APIRouter(prefix="/api/tags", tags=["tags"])

@router.get("", response_model=List[TagResponse])
def get_tags():
    return service.get_all_tags()

@router.post("", response_model=TagResponse)
def create_tag(data: TagCreate):
    tag = service.create_tag(data.name)
    if not tag:
        raise HTTPException(status_code=400, detail="Không thể tạo thể loại")
    return tag

@router.put("/{tag_id}", response_model=TagResponse)
def update_tag(tag_id: int, data: TagUpdate):
    updated = service.update_tag(tag_id, data.name)
    if not updated:
        raise HTTPException(status_code=404, detail="Không tìm thấy thể loại")
    return updated

@router.delete("/{tag_id}")
def delete_tag(tag_id: int):
    service.delete_tag(tag_id)
    return {"message": "Đã xóa thể loại thành công"}

@router.get("/{tag_id}/comics", response_model=List[ComicResponse])
def get_comics_by_tag(tag_id: int):
    return service.get_comics_by_tag_id(tag_id)
