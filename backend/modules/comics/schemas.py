from pydantic import BaseModel
from typing import List, Optional

class ComicBase(BaseModel):
    title: str
    author: Optional[str] = None
    source_url: Optional[str] = None
    genres: List[str] = []

class ComicCreate(ComicBase):
    pass

class ComicUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    source_url: Optional[str] = None
    genres: Optional[List[str]] = None

class ComicResponse(BaseModel):
    id: int
    title: str
    author: Optional[str] = None
    source_url: Optional[str] = None
    genres: List[str] = []
    cover_filename: Optional[str] = None

    class Config:
        from_attributes = True

class ComicDetailResponse(ComicResponse):
    chapters: List[dict] = []
