"""
Images Schemas Module
=====================
Định nghĩa các schema dữ liệu (Request/Response models) cho module Images.
"""

from pydantic import BaseModel


class DownloadCoverRequest(BaseModel):
    """
    Schema yêu cầu tải ảnh bìa:
    - url: Link ảnh bìa bất kỳ từ nhentai (VD: https://t3.nhentai.net/galleries/4126277/1t.webp)
    - comic_id: ID bộ truyện trong database cần gắn ảnh bìa
    """
    url: str
    comic_id: int
