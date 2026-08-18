from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ComicBase(BaseModel):
    title: str
    author: Optional[str] = None
    source_url: Optional[str] = None
    tags: List[str] = []

class ComicCreate(ComicBase):
    pass

class ComicUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    source_url: Optional[str] = None
    tags: Optional[List[str]] = None

class ComicResponse(BaseModel):
    id: int
    title: str
    author: Optional[str] = None
    source_url: Optional[str] = None
    tags: List[str] = []
    cover_filename: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ComicDetailResponse(ComicResponse):
    chapters: List[dict] = []
