"""
Chapters Schemas Module
=======================
Định nghĩa các Pydantic schema cho module quản lý Chapters (Hồi/Tập truyện).
Hỗ trợ phân chia chapter theo khoảng trang: start_page -> end_page.
"""

from pydantic import BaseModel, model_validator
from typing import Optional

class ChapterBase(BaseModel):
    """
    Schema cơ sở chứa các trường thông tin chung của Chapter:
    - chapter_number: Số thứ tự tập/hồi (VD: 1, 1.5, 2...)
    - title: Tiêu đề chapter (tùy chọn)
    - base_url: Đường link ảnh mẫu (VD trang 1) dùng để sinh ra danh sách URL các trang
    - start_page: Số trang bắt đầu của chapter (mặc định là 1)
    - end_page: Số trang kết thúc của chapter
    """
    chapter_number: float
    title: Optional[str] = None
    base_url: str
    start_page: int = 1
    end_page: int

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
    start_page: Optional[int] = None
    end_page: Optional[int] = None

class ChapterResponse(BaseModel):
    """
    Schema dữ liệu trả về của Chapter từ database:
    - Tự động tính tổng số trang: total_pages = end_page - start_page + 1
    """
    id: int
    comic_id: int
    chapter_number: float
    title: Optional[str] = None
    base_url: str
    start_page: int = 1
    end_page: int
    total_pages: Optional[int] = None

    @model_validator(mode="after")
    def compute_total_pages(self):
        if self.end_page is not None and self.start_page is not None:
            self.total_pages = max(1, self.end_page - self.start_page + 1)
        return self

    class Config:
        from_attributes = True
