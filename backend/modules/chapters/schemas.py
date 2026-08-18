from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChapterBase(BaseModel):
    chapter_number: float
    title: Optional[str] = None
    base_url: str
    total_pages: int

class ChapterCreate(ChapterBase):
    pass

class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    chapter_number: Optional[float] = None
    base_url: Optional[str] = None
    total_pages: Optional[int] = None

class ChapterResponse(ChapterBase):
    id: int
    comic_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
