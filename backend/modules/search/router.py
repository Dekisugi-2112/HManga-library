"""
Search Router Module
====================
Định nghĩa endpoint RESTful API tìm kiếm nâng cao (/api/search).
"""

from fastapi import APIRouter
from typing import Optional
import modules.search.service as service

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("")
def search(q: Optional[str] = None, genre: Optional[str] = None, author: Optional[str] = None):
    """
    API tìm kiếm truyện kết hợp nhiều tiêu chí:
    - q: Từ khóa trong tên truyện (VD: ?q=naruto)
    - genre: Tên thể loại (VD: ?genre=Action)
    - author: Tên tác giả (VD: ?author=Oda)
    """
    return service.search_comics(q=q, genre=genre, author=author)
