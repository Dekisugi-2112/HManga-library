from fastapi import APIRouter, HTTPException
from typing import List
from modules.genres.schemas import GenreCreate, GenreUpdate, GenreResponse
from modules.comics.schemas import ComicResponse
import modules.genres.service as service

router = APIRouter(prefix="/api/genres", tags=["genres"])

@router.get("", response_model=List[GenreResponse])
def get_genres():
    return service.get_all_genres()

@router.post("", response_model=GenreResponse)
def create_genre(data: GenreCreate):
    genre = service.create_genre(data.name)
    if not genre:
        raise HTTPException(status_code=400, detail="Không thể tạo thể loại")
    return genre

@router.put("/{genre_id}", response_model=GenreResponse)
def update_genre(genre_id: int, data: GenreUpdate):
    updated = service.update_genre(genre_id, data.name)
    if not updated:
        raise HTTPException(status_code=404, detail="Không tìm thấy thể loại")
    return updated

@router.delete("/{genre_id}")
def delete_genre(genre_id: int):
    service.delete_genre(genre_id)
    return {"message": "Đã xóa thể loại thành công"}

@router.get("/{genre_id}/comics", response_model=List[ComicResponse])
def get_comics_by_genre(genre_id: int):
    return service.get_comics_by_genre_id(genre_id)
