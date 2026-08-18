from core.database import supabase

def search_comics(q: str = None, genre: str = None, author: str = None):
    query = supabase.table("comics").select("id, title, author, cover_filename, updated_at").order("id", desc=False)
    
    if author:
        query = query.ilike("author", f"%{author}%")
    if q:
        query = query.ilike("title", f"%{q}%")
        
    response = query.execute()
    comics = response.data or []
    
    if not comics:
        return []
        
    # Xử lý genres
    comic_ids = [c["id"] for c in comics]
    genres_response = supabase.table("comic_genres").select("comic_id, genres(name)").in_("comic_id", comic_ids).execute()
    
    genres_map = {}
    for item in genres_response.data or []:
        c_id = item["comic_id"]
        genre_name = item["genres"]["name"]
        if c_id not in genres_map:
            genres_map[c_id] = []
        genres_map[c_id].append(genre_name)
        
    result = []
    for comic in comics:
        comic["genres"] = genres_map.get(comic["id"], [])
        if genre and genre not in comic["genres"]:
            continue
        result.append(comic)
        
    return result
