from fastapi import APIRouter
from typing import Optional
import modules.search.service as service

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("")
def search(q: Optional[str] = None, genre: Optional[str] = None, author: Optional[str] = None):
    return service.search_comics(q=q, genre=genre, author=author)
