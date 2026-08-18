"""
Images Service Module
=====================
Xử lý tải và quản lý file ảnh bìa (Cover images).
Nhiệm vụ:
- Tải file ảnh bìa từ nguồn bên ngoài (như hentaifox) về lưu trữ tại thư mục cục bộ `cover-images/`.
- Sử dụng HTTP headers thích hợp (Referer, User-Agent) để vượt qua chặn hotlink/anti-scraping.
- Cập nhật tên file ảnh bìa (`cover_filename`) vào database và làm mới cache.
"""

import os
import httpx
from pathlib import Path
import aiofiles
from fastapi import HTTPException
from core.database import supabase
from modules.comics.service import update_cache

# Thư mục lưu trữ ảnh bìa cục bộ trên server
COVER_DIR = Path(__file__).parent.parent.parent.parent / "cover-images"

async def download_cover(url: str, comic_id: int):
    """
    Tải ảnh bìa từ URL về máy chủ và cập nhật vào bộ truyện:
    1. Trích xuất gallery_id và đuôi file ảnh từ URL (VD: '4029076.jpg').
    2. Gửi request bất đồng bộ bằng `httpx` kèm header Referer để tải ảnh.
    3. Ghi file ảnh vào thư mục `cover-images/` bằng `aiofiles`.
    4. Cập nhật `cover_filename` trong bảng `comics` và làm mới cache JSON.
    """
    # Tạo thư mục nếu chưa tồn tại
    COVER_DIR.mkdir(parents=True, exist_ok=True)
    
    # Tách gallery_id và phần mở rộng (extension) từ URL
    # Ví dụ URL mẫu: https://i3.hentaifox.com/004/4029076/1t.jpg -> gallery_id = 4029076, ext = jpg
    parts = url.split("/")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid URL format")
        
    gallery_id = parts[-2]
    ext = parts[-1].split(".")[-1] if "." in parts[-1] else "jpg"
    filename = f"{gallery_id}.{ext}"
    filepath = COVER_DIR / filename
    
    try:
        async with httpx.AsyncClient() as client:
            # Thiết lập header giả lập trình duyệt để tránh bị chặn 403 Forbidden
            headers = {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://hentaifox.com/"
            }
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            # Ghi file ảnh bất đồng bộ vào đĩa cứng
            async with aiofiles.open(filepath, "wb") as f:
                await f.write(response.content)
                
        # Cập nhật tên file ảnh bìa vào cơ sở dữ liệu Supabase
        supabase.table("comics").update({"cover_filename": filename}).eq("id", comic_id).execute()
        update_cache()
        
        return {"message": "Cover downloaded successfully", "filename": filename}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
