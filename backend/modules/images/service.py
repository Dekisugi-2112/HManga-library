import os
import httpx
from pathlib import Path
import aiofiles
from fastapi import HTTPException
from core.database import supabase
from modules.comics.service import update_cache

# Thư mục lưu trữ cover
COVER_DIR = Path(__file__).parent.parent.parent.parent / "cover-images"

async def download_cover(url: str, comic_id: int):
    # Tạo thư mục nếu chưa có
    COVER_DIR.mkdir(parents=True, exist_ok=True)
    
    # Extract gallery_id and extension from URL
    # Example: https://i3.hentaifox.com/004/4029076/1t.jpg
    parts = url.split("/")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid URL format")
        
    gallery_id = parts[-2]
    ext = parts[-1].split(".")[-1] if "." in parts[-1] else "jpg"
    filename = f"{gallery_id}.{ext}"
    filepath = COVER_DIR / filename
    
    try:
        async with httpx.AsyncClient() as client:
            # Download image with hentaifox specific headers
            headers = {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://hentaifox.com/"
            }
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            async with aiofiles.open(filepath, "wb") as f:
                await f.write(response.content)
                
        # Cập nhật database
        supabase.table("comics").update({"cover_filename": filename}).eq("id", comic_id).execute()
        update_cache()
        
        return {"message": "Cover downloaded successfully", "filename": filename}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
