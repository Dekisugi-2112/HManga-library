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
import re
import httpx
from pathlib import Path
import aiofiles
from fastapi import HTTPException
from core.database import supabase
from modules.comics.service import update_cache

# Thư mục lưu trữ ảnh bìa cục bộ trên server
COVER_DIR = Path(__file__).parent.parent.parent.parent / "cover-images"

def convert_to_page_one_url(url: str, high_res: bool = True) -> str:
    """
    Chuyển đổi bất kỳ URL trang nào (VD: .../236t.jpg, .../15.jpg)
    thành URL của trang đầu tiên (VD: .../1.jpg hoặc .../1t.jpg) để làm ảnh bìa chuẩn.
    - Nếu high_res=True: Loại bỏ hậu tố 't' (thumbnail) để lấy ảnh gốc Full HD sắc nét (1146x1600px).
    - Nếu high_res=False: Giữ nguyên hậu tố 't'.
    """
    m = re.search(r'^(.*\/)(\d+)([a-zA-Z]*)(\.\w+)(\?.*)?$', url.strip())
    if m:
        prefix = m.group(1)
        suffix = m.group(3) or ''
        ext = m.group(4)
        if high_res and suffix.lower() == 't':
            suffix = ''
        return f"{prefix}1{suffix}{ext}"
    return url

async def download_cover(url: str, comic_id: int):
    """
    Tải ảnh bìa từ URL về máy chủ và cập nhật vào bộ truyện:
    - Ưu tiên tải ảnh gốc chất lượng cao Full HD (1146x1600px, không có hậu tố 't').
    - Nếu không có, tự động chuyển sang tải ảnh thumbnail trang 1.
    - Lưu file với tên {folder}-{gallery_id}.{ext} (VD: '001-48410.jpg').
    - Cập nhật `cover_filename` trong bảng `comics` và làm mới cache JSON.
    """
    COVER_DIR.mkdir(parents=True, exist_ok=True)
    
    parts = [p for p in url.split("/") if p]
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid URL format")
        
    # Nếu URL có cấu trúc /folder/gallery_id/file (VD: /001/48410/236t.jpg) -> kết hợp thành '001-48410'
    if len(parts) >= 3 and parts[-3].isdigit() and parts[-2].isdigit():
        gallery_id = f"{parts[-3]}-{parts[-2]}"
    else:
        gallery_id = parts[-2]
        
    ext = parts[-1].split(".")[-1] if "." in parts[-1] else "jpg"
    # Loại bỏ query parameters nếu có trong extension
    ext = ext.split("?")[0]
    filename = f"{gallery_id}.{ext}"
    filepath = COVER_DIR / filename
    
    # 1. Ưu tiên tải ảnh gốc Full HD trang 1 (bỏ chữ 't')
    high_res_url = convert_to_page_one_url(url, high_res=True)
    # 2. Link thumbnail trang 1 (có chữ 't')
    thumb_url = convert_to_page_one_url(url, high_res=False)
    
    # Danh sách các link thử tải theo thứ tự ưu tiên
    urls_to_try = [high_res_url]
    if thumb_url not in urls_to_try:
        urls_to_try.append(thumb_url)
    if url not in urls_to_try:
        urls_to_try.append(url)
        
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://hentaifox.com/"
            }
            
            response = None
            for target_url in urls_to_try:
                try:
                    res = await client.get(target_url, headers=headers)
                    if res.status_code == 200:
                        response = res
                        break
                except Exception as req_err:
                    print(f"[Warning] Failed to fetch cover from {target_url}: {req_err}")
                    
            if not response or response.status_code != 200:
                raise HTTPException(status_code=400, detail="Không thể tải ảnh bìa trang 1 từ URL đã cung cấp")
            
            # Ghi file ảnh bất đồng bộ vào đĩa cứng
            async with aiofiles.open(filepath, "wb") as f:
                await f.write(response.content)
                
        # Cập nhật tên file ảnh bìa vào cơ sở dữ liệu Supabase
        supabase.table("comics").update({"cover_filename": filename}).eq("id", comic_id).execute()
        update_cache()
        
        return {"message": "Cover downloaded successfully", "filename": filename}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
