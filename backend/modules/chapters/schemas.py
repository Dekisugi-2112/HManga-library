"""
Chapters Schemas Module
=======================
Định nghĩa các Pydantic schema cho module quản lý Chapters (Hồi/Tập truyện).
Nhiệm vụ:
- Kiểm thực dữ liệu khi tạo mới và chỉnh sửa chapter.
- Định dạng dữ liệu trả về cho client.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChapterBase(BaseModel):
    """
    Schema cơ sở chứa các trường thông tin chung của Chapter:
    - chapter_number: Số thứ tự tập/hồi (có thể là số thực: 1, 1.5, 2...)
    - title: Tiêu đề chapter (tùy chọn)
    - base_url: Đường link ảnh mẫu (VD trang 1) dùng để sinh ra danh sách URL các trang
    - total_pages: Tổng số trang ảnh trong chapter
    """
    chapter_number: float
    title: Optional[str] = None
    base_url: str
    total_pages: int

class ChapterCreate(ChapterBase):
    """Schema dữ liệu khi tạo mới một Chapter thuộc về một bộ truyện"""
    pass

class ChapterUpdate(BaseModel):
    """
    Schema dữ liệu khi cập nhật thông tin Chapter.
    Tất cả các trường đều là tùy chọn.
    """
    title: Optional[str] = None
    chapter_number: Optional[float] = None
    base_url: Optional[str] = None
    total_pages: Optional[int] = None

class ChapterResponse(ChapterBase):
    """Schema dữ liệu trả về của Chapter từ database"""
    id: int
    comic_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
