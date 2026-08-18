from pydantic import BaseModel
from typing import Optional

class GenreCreate(BaseModel):
    name: str

class GenreUpdate(BaseModel):
    name: str

class GenreResponse(BaseModel):
    id: int
    name: str
    comic_count: Optional[int] = 0
