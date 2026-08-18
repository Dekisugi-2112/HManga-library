from core.database import supabase

def search_comics(q: str = None, tag: str = None, status: str = None, author: str = None):
    query = supabase.table("comics").select("id, title, author, type, status, cover_filename, updated_at")
    
    if status:
        query = query.eq("status", status)
    if author:
        query = query.ilike("author", f"%{author}%")
    if q:
        query = query.ilike("title", f"%{q}%")
        
    response = query.execute()
    comics = response.data
    
    if not comics:
        return []
        
    # Xử lý tags
    comic_ids = [c["id"] for c in comics]
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
