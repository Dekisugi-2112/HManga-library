import re
from core.database import supabase
from modules.chapters.schemas import ChapterCreate, ChapterUpdate
from modules.comics.service import update_cache

def get_chapters(comic_id: int):
    response = supabase.table("chapters").select("*").eq("comic_id", comic_id).order("chapter_number").execute()
    return response.data

def create_chapter(comic_id: int, chapter_data: ChapterCreate):
    chapter_dict = chapter_data.dict()
    chapter_dict["comic_id"] = comic_id
    response = supabase.table("chapters").insert(chapter_dict).execute()
    update_cache()
    return response.data[0]

def update_chapter(chapter_id: int, chapter_data: ChapterUpdate):
    update_dict = {k: v for k, v in chapter_data.dict().items() if v is not None}
    response = supabase.table("chapters").update(update_dict).eq("id", chapter_id).execute()
    update_cache()
    return response.data[0] if response.data else None

def delete_chapter(chapter_id: int):
    supabase.table("chapters").delete().eq("id", chapter_id).execute()
    update_cache()

def generate_pages(chapter_id: int):
    response = supabase.table("chapters").select("base_url, total_pages").eq("id", chapter_id).execute()
    if not response.data:
        return []
        
    chapter = response.data[0]
    base_url = chapter["base_url"]
    total_pages = chapter["total_pages"]
    
    # URL Pattern from hentaifox example: https://i3.hentaifox.com/004/4029076/1t.jpg
    match = re.search(r'/(\d+)([^/]*\.\w+)$', base_url)
    if not match:
        # Fallback if pattern is not recognized
        return [base_url] * total_pages
        
    prefix = base_url[:match.start(1)]
    suffix = match.group(2)
    
    return [f"{prefix}{i}{suffix}" for i in range(1, total_pages + 1)]
