"""
Comics Schemas Module
=====================
Định nghĩa các Pydantic model (schemas) phục vụ việc xác thực dữ liệu đầu vào
và định dạng dữ liệu trả về cho các API liên quan đến truyện tranh (Comics).
"""

from pydantic import BaseModel
from typing import List, Optional

class ComicBase(BaseModel):
    """
    Schema cơ sở chứa các trường thông tin cơ bản của một bộ truyện:
    - title: Tên bộ truyện (bắt buộc)
    - author: Tên tác giả (tùy chọn)
    - source_url: Link gốc tham khảo từ hentaifox (tùy chọn)
    - genres: Danh sách tên các thể loại được chọn (mặc định rỗng)
    """
    title: str
    author: Optional[str] = None
    source_url: Optional[str] = None
    genres: List[str] = []

class ComicCreate(ComicBase):
    """
    Schema nhận dữ liệu từ client khi tạo mới một bộ truyện.
    Kế thừa toàn bộ từ ComicBase.
    """
    pass

class ComicUpdate(BaseModel):
    """
    Schema nhận dữ liệu khi cập nhật/chỉnh sửa thông tin một bộ truyện.
    Tất cả các trường đều là tùy chọn (Optional), chỉ cập nhật những trường được gửi lên.
    """
    title: Optional[str] = None
    author: Optional[str] = None
    source_url: Optional[str] = None
    genres: Optional[List[str]] = None

class ComicResponse(BaseModel):
    """
    Schema định dạng dữ liệu một bộ truyện khi trả về danh sách cho client:
    - id: Khóa chính tự tăng của bộ truyện
    - gallery_id: Mã ID định dạng 'xxx-xxxxx' (VD: '001-48410')
    - cover_filename: Tên file ảnh bìa lưu tại local (VD: 001-48410.jpg)
    """
    id: int
    gallery_id: Optional[str] = None
    title: str
    author: Optional[str] = None
    source_url: Optional[str] = None
    genres: List[str] = []
    cover_filename: Optional[str] = None

    class Config:
        from_attributes = True

class ComicDetailResponse(ComicResponse):
    """
    Schema định dạng dữ liệu chi tiết của một bộ truyện (gồm cả danh sách các chapter):
    - chapters: Danh sách các tập/chương truyện đã sắp xếp
    """
    chapters: List[dict] = []
