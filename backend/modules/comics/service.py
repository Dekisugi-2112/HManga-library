import json
from pathlib import Path
from core.database import supabase
from modules.comics.schemas import ComicCreate, ComicUpdate

CACHE_DIR = Path(__file__).parent.parent.parent / "cache"
CACHE_FILE = CACHE_DIR / "comics_cache.json"

def get_all_comics(tag: str = None, q: str = None):
    # Fetch comics ordered by id ascending (1, 2, 3...)
    query = supabase.table("comics").select("*").order("id", desc=False)
    if q:
        query = query.ilike("title", f"%{q}%")
    
    response = query.execute()
    comics = response.data
    
    # Process tags
    comic_ids = [c["id"] for c in comics]
    if not comic_ids:
        return []
        
    tags_response = supabase.table("comic_tags").select("comic_id, tags(name)").in_("comic_id", comic_ids).execute()
    tags_map = {}
    for item in tags_response.data:
        c_id = item["comic_id"]
        tag_name = item["tags"]["name"]
        if c_id not in tags_map:
            tags_map[c_id] = []
        tags_map[c_id].append(tag_name)
        
    result = []
    for comic in comics:
        comic["tags"] = tags_map.get(comic["id"], [])
        if tag and tag not in comic["tags"]:
            continue
        result.append(comic)
        
    return result

def get_comic_detail(comic_id: int):
    response = supabase.table("comics").select("*").eq("id", comic_id).execute()
    if not response.data:
        return None
    comic = response.data[0]
    
    # Fetch tags
    tags_response = supabase.table("comic_tags").select("tags(name)").eq("comic_id", comic_id).execute()
    comic["tags"] = [item["tags"]["name"] for item in tags_response.data]
    
    # Fetch chapters
    chapters_response = supabase.table("chapters").select("*").eq("comic_id", comic_id).order("chapter_number").execute()
    comic["chapters"] = chapters_response.data
    
    return comic

def create_comic(comic_data: ComicCreate):
    # Ensure tags exist
    tag_ids = []
    for tag_name in comic_data.tags:
        tag_res = supabase.table("tags").select("id").eq("name", tag_name).execute()
        if not tag_res.data:
            new_tag = supabase.table("tags").insert({"name": tag_name}).execute()
            tag_ids.append(new_tag.data[0]["id"])
        else:
            tag_ids.append(tag_res.data[0]["id"])
            
    # Insert comic
    comic_dict = comic_data.dict(exclude={"tags"})
    response = supabase.table("comics").insert(comic_dict).execute()
    new_comic = response.data[0]
    
    # Insert comic_tags
    for tag_id in tag_ids:
        supabase.table("comic_tags").insert({"comic_id": new_comic["id"], "tag_id": tag_id}).execute()
        
    update_cache()
    return get_comic_detail(new_comic["id"])

def update_comic(comic_id: int, comic_data: ComicUpdate):
    comic_dict = {k: v for k, v in comic_data.dict(exclude={"tags"}).items() if v is not None}
    if comic_dict:
        supabase.table("comics").update(comic_dict).eq("id", comic_id).execute()
    
    # Update tags if provided
    if comic_data.tags is not None:
        supabase.table("comic_tags").delete().eq("comic_id", comic_id).execute()
        tag_ids = []
        for tag_name in comic_data.tags:
            tag_res = supabase.table("tags").select("id").eq("name", tag_name).execute()
            if not tag_res.data:
                new_tag = supabase.table("tags").insert({"name": tag_name}).execute()
                tag_ids.append(new_tag.data[0]["id"])
            else:
                tag_ids.append(tag_res.data[0]["id"])
                
        for tag_id in tag_ids:
            supabase.table("comic_tags").insert({"comic_id": comic_id, "tag_id": tag_id}).execute()
        
    update_cache()
    return get_comic_detail(comic_id)

def delete_comic(comic_id: int):
    comic_res = supabase.table("comics").select("cover_filename").eq("id", comic_id).execute()
    cover_filename = comic_res.data[0]["cover_filename"] if comic_res.data else None
    
    supabase.table("chapters").delete().eq("comic_id", comic_id).execute()
    supabase.table("comic_tags").delete().eq("comic_id", comic_id).execute()
    supabase.table("comics").delete().eq("id", comic_id).execute()
    
    if cover_filename:
        cover_path = Path(__file__).parent.parent.parent.parent / "cover-images" / cover_filename
        if cover_path.exists():
            cover_path.unlink()
    
    update_cache()

def check_comic_by_gallery_id(gallery_id: str):
    response = supabase.table("comics").select("*").ilike("source_url", f"%/{gallery_id}/%").execute()
    if response.data:
        comic = response.data[0]
        tags_response = supabase.table("comic_tags").select("tags(name)").eq("comic_id", comic["id"]).execute()
        comic["tags"] = [item["tags"]["name"] for item in tags_response.data]
        chapters_response = supabase.table("chapters").select("*").eq("comic_id", comic["id"]).order("chapter_number").execute()
        comic["chapters"] = chapters_response.data
        return comic
    return None

def update_cache():
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    comics = get_all_comics()
    for comic in comics:
        chapters = supabase.table("chapters").select("*").eq("comic_id", comic["id"]).order("chapter_number").execute()
        comic["chapters"] = chapters.data
        
    from datetime import datetime
    cache_data = {
        "comics": comics,
        "last_updated": datetime.utcnow().isoformat() + "Z"
    }
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, ensure_ascii=False, indent=2)
