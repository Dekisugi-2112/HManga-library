from core.database import supabase
from modules.comics.service import update_cache

def get_all_tags():
    tags_res = supabase.table("tags").select("*").order("name").execute()
    tags = tags_res.data or []
    
    if not tags:
        return []
        
    # Lấy thống kê số lượng truyện cho từng tag
    comic_tags_res = supabase.table("comic_tags").select("tag_id").execute()
    count_map = {}
    for item in comic_tags_res.data or []:
        t_id = item["tag_id"]
        count_map[t_id] = count_map.get(t_id, 0) + 1
        
    for tag in tags:
        tag["comic_count"] = count_map.get(tag["id"], 0)
        
    return tags

def create_tag(name: str):
    clean_name = name.strip().lower()
    existing = supabase.table("tags").select("*").eq("name", clean_name).execute()
    if existing.data:
        tag = existing.data[0]
        tag["comic_count"] = 0
        return tag
        
    res = supabase.table("tags").insert({"name": clean_name}).execute()
    if res.data:
        tag = res.data[0]
        tag["comic_count"] = 0
        update_cache()
        return tag
    return None

def update_tag(tag_id: int, new_name: str):
    clean_name = new_name.strip().lower()
    res = supabase.table("tags").update({"name": clean_name}).eq("id", tag_id).execute()
    if res.data:
        update_cache()
        tag = res.data[0]
        # Get count
        comic_tags_res = supabase.table("comic_tags").select("comic_id").eq("tag_id", tag_id).execute()
        tag["comic_count"] = len(comic_tags_res.data or [])
        return tag
    return None

def delete_tag(tag_id: int):
    supabase.table("comic_tags").delete().eq("tag_id", tag_id).execute()
    supabase.table("tags").delete().eq("id", tag_id).execute()
    update_cache()
    return True

def get_comics_by_tag_id(tag_id: int):
    # Lấy danh sách comic_id
    ct_res = supabase.table("comic_tags").select("comic_id").eq("tag_id", tag_id).execute()
    comic_ids = [item["comic_id"] for item in ct_res.data or []]
    if not comic_ids:
        return []
        
    comics_res = supabase.table("comics").select("*").in_("id", comic_ids).order("id", desc=False).execute()
    comics = comics_res.data or []
    
    # Lấy tất cả tags cho các comic này
    all_ct_res = supabase.table("comic_tags").select("comic_id, tags(name)").in_("comic_id", comic_ids).execute()
    tags_map = {}
    for item in all_ct_res.data or []:
        c_id = item["comic_id"]
        t_name = item["tags"]["name"]
        if c_id not in tags_map:
            tags_map[c_id] = []
        tags_map[c_id].append(t_name)
        
    for c in comics:
        c["tags"] = tags_map.get(c["id"], [])
        
    return comics
