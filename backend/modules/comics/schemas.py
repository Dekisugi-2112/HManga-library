from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ComicBase(BaseModel):
    title: str
    author: Optional[str] = None
    type: str = "multi"
    status: str = "ongoing"
    source_url: Optional[str] = None
    personal_note: Optional[str] = None
    tags: List[str] = []

class ComicCreate(ComicBase):
    pass

class ComicUpdate(ComicBase):
    pass

class ComicResponse(ComicBase):
    id: int
    cover_filename: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ComicDetailResponse(ComicResponse):
    chapters: List[dict] = []
