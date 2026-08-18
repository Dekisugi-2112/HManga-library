"""
Search Router Module
====================
Cung cấp API endpoint phục vụ tính năng tìm kiếm và lọc dữ liệu truyện (/api/search).
Nhiệm vụ:
- GET /api/search: Tiếp nhận các tham số query params (`q`, `tag`, `author`) và trả về danh sách kết quả phù hợp.
"""

from fastapi import APIRouter
from typing import Optional
import modules.search.service as service

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("")
def search(q: Optional[str] = None, tag: Optional[str] = None, author: Optional[str] = None):
    """API tìm kiếm nâng cao theo tên truyện, tác giả và tag thể loại"""
    return service.search_comics(q=q, tag=tag, author=author)
