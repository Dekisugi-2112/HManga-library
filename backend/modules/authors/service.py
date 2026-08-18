from core.database import supabase
from modules.comics.service import update_cache

def get_all_authors():
    res = supabase.table("comics").select("id, author").not_.is_("author", "null").execute()
    comics = res.data or []
    
    count_map = {}
    for c in comics:
        author = (c.get("author") or "").strip()
        if author:
            count_map[author] = count_map.get(author, 0) + 1
            
    authors = [{"name": name, "comic_count": count} for name, count in count_map.items()]
    authors.sort(key=lambda x: x["name"].lower())
    return authors

def rename_author(old_name: str, new_name: str):
    clean_old = old_name.strip()
    clean_new = new_name.strip()
    if not clean_old or not clean_new:
        return {"updated_count": 0}
        
    res = supabase.table("comics").update({"author": clean_new}).eq("author", clean_old).execute()
    updated_count = len(res.data or [])
    update_cache()
    return {"updated_count": updated_count, "new_name": clean_new}

def get_comics_by_author(author_name: str):
    clean_author = author_name.strip()
    res = supabase.table("comics").select("*").eq("author", clean_author).order("id", desc=False).execute()
    comics = res.data or []
    
    comic_ids = [c["id"] for c in comics]
    if not comic_ids:
        return []
        
    tags_res = supabase.table("comic_tags").select("comic_id, tags(name)").in_("comic_id", comic_ids).execute()
    tags_map = {}
    for item in tags_res.data or []:
        c_id = item["comic_id"]
        t_name = item["tags"]["name"]
        if c_id not in tags_map:
            tags_map[c_id] = []
        tags_map[c_id].append(t_name)
        
    for c in comics:
        c["tags"] = tags_map.get(c["id"], [])
        
    return comics
