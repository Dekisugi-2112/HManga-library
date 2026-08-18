from fastapi import APIRouter
from typing import List
from modules.authors.schemas import AuthorResponse, AuthorRenameRequest
from modules.comics.schemas import ComicResponse
import modules.authors.service as service

router = APIRouter(prefix="/api/authors", tags=["authors"])

@router.get("", response_model=List[AuthorResponse])
def get_authors():
    return service.get_all_authors()

@router.put("/rename")
def rename_author(data: AuthorRenameRequest):
    return service.rename_author(data.old_name, data.new_name)

@router.get("/{author_name}/comics", response_model=List[ComicResponse])
def get_comics_by_author(author_name: str):
    return service.get_comics_by_author(author_name)
