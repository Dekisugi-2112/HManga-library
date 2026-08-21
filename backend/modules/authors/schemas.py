"""
Authors Schemas Module
======================
Định nghĩa các Pydantic schema cho module quản lý Tác giả (Authors):
- AuthorRenameRequest: Dữ liệu gửi lên khi yêu cầu đổi tên tác giả hàng loạt.
- AuthorResponse: Dữ liệu trả về biểu diễn tên tác giả và số lượng tác phẩm.
"""

from pydantic import BaseModel, ConfigDict

class AuthorRenameRequest(BaseModel):
    """
    Schema nhận yêu cầu đổi tên tác giả hàng loạt:
    - old_name: Tên tác giả hiện tại cần đổi
    - new_name: Tên tác giả mới muốn cập nhật cho toàn bộ truyện liên quan
    """
    old_name: str
    new_name: str

class AuthorResponse(BaseModel):
    """
    Schema trả về cho client:
    - name: Tên tác giả
    - comic_count: Tổng số bộ truyện trong thư viện thuộc về tác giả này
    """
    name: str
    comic_count: int

    model_config = ConfigDict(from_attributes=True)
