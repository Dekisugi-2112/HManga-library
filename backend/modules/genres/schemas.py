"""
Genres Schemas Module
=====================
Định nghĩa các Pydantic schema cho module quản lý Thể loại (Genres):
- GenreCreate: Dữ liệu gửi lên khi thêm thể loại mới.
- GenreUpdate: Dữ liệu gửi lên khi đổi tên thể loại.
- GenreResponse: Dữ liệu trả về cho client (gồm id, tên, và số lượng truyện thuộc thể loại).
"""

from pydantic import BaseModel
from typing import Optional

class GenreCreate(BaseModel):
    """Schema khi tạo thể loại mới (chỉ cần trường name)"""
    name: str

class GenreUpdate(BaseModel):
    """Schema khi đổi tên thể loại"""
    name: str

class GenreResponse(BaseModel):
    """
    Schema trả về cho client:
    - id: Khóa chính của thể loại trong bảng genres
    - name: Tên thể loại (VD: Action, Romance, v.v.)
    - comic_count: Trường tính toán động (computed field) biểu thị số lượng truyện thuộc thể loại này
    """
    id: int
    name: str
    comic_count: Optional[int] = 0

    class Config:
        from_attributes = True
