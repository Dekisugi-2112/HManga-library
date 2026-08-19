"""
Authors Router Module
=====================
Định nghĩa các endpoint RESTful API quản lý Tác giả (/api/authors):
- GET /api/authors: Lấy danh sách toàn bộ tác giả và số lượng tác phẩm.
- PUT /api/authors/rename: Đổi tên tác giả hàng loạt cho tất cả các bộ truyện.
- GET /api/authors/{author_name}/comics: Lấy danh sách các bộ truyện của một tác giả.
"""

from fastapi import APIRouter
from typing import List
from modules.authors.schemas import AuthorResponse, AuthorRenameRequest
from modules.comics.schemas import ComicResponse
import modules.authors.service as service

router = APIRouter(prefix="/api/authors", tags=["authors"])

@router.get("", response_model=List[AuthorResponse])
def get_authors():
    """API lấy danh sách toàn bộ tác giả và số lượng truyện của từng tác giả"""
    return service.get_all_authors()

@router.put("/rename")
def rename_author(data: AuthorRenameRequest):
    """
    API đổi tên tác giả hàng loạt:
    - Nhận vào: old_name và new_name
    - Cập nhật tất cả các truyện trong DB và trả về số lượng truyện đã sửa
    """
    return service.rename_author(data.old_name, data.new_name)

@router.get("/{author_name}/comics", response_model=List[ComicResponse])
def get_comics_by_author(author_name: str):
    """API lấy danh sách tất cả các bộ truyện của một tác giả cụ thể"""
    return service.get_comics_by_author(author_name)
