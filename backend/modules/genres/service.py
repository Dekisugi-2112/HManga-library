from core.database import supabase
from modules.comics.service import update_cache

def get_all_genres():
    try:
        genres_res = supabase.table("genres").select("*").order("name").execute()
        genres = genres_res.data or []
    except Exception as e:
        print(f"[Warning] Error querying genres: {e}")
        return []
    
    if not genres:
        return []
        
    try:
        comic_genres_res = supabase.table("comic_genres").select("genre_id").execute()
        count_map = {}
        for item in comic_genres_res.data or []:
            g_id = item["genre_id"]
            count_map[g_id] = count_map.get(g_id, 0) + 1
            
        for genre in genres:
            genre["comic_count"] = count_map.get(genre["id"], 0)
    except Exception as e:
        print(f"[Warning] Error querying comic_genres: {e}")
        for genre in genres:
            genre["comic_count"] = 0
        
    return genres

def create_genre(name: str):
    clean_name = name.strip()
    try:
        existing = supabase.table("genres").select("*").ilike("name", clean_name).execute()
        if existing.data:
            genre = existing.data[0]
            genre["comic_count"] = 0
            return genre
            
        res = supabase.table("genres").insert({"name": clean_name}).execute()
        if res.data:
            genre = res.data[0]
            genre["comic_count"] = 0
            update_cache()
            return genre
    except Exception as e:
        print(f"[Error] Error creating genre: {e}")
        return None
    return None

def update_genre(genre_id: int, new_name: str):
    clean_name = new_name.strip()
    try:
        res = supabase.table("genres").update({"name": clean_name}).eq("id", genre_id).execute()
        if res.data:
            update_cache()
            genre = res.data[0]
            try:
                comic_genres_res = supabase.table("comic_genres").select("comic_id").eq("genre_id", genre_id).execute()
                genre["comic_count"] = len(comic_genres_res.data or [])
            except:
                genre["comic_count"] = 0
            return genre
    except Exception as e:
        print(f"[Error] Error updating genre: {e}")
        return None
    return None

def delete_genre(genre_id: int):
    try:
        supabase.table("comic_genres").delete().eq("genre_id", genre_id).execute()
        supabase.table("genres").delete().eq("id", genre_id).execute()
        update_cache()
    except Exception as e:
        print(f"[Error] Error deleting genre: {e}")
    return True

def get_comics_by_genre_id(genre_id: int):
    try:
        cg_res = supabase.table("comic_genres").select("comic_id").eq("genre_id", genre_id).execute()
        comic_ids = [item["comic_id"] for item in cg_res.data or []]
        if not comic_ids:
            return []
            
        comics_res = supabase.table("comics").select("*").in_("id", comic_ids).order("id", desc=False).execute()
        comics = comics_res.data or []
        
        all_cg_res = supabase.table("comic_genres").select("comic_id, genres(name)").in_("comic_id", comic_ids).execute()
        genres_map = {}
        for item in all_cg_res.data or []:
            c_id = item["comic_id"]
            g_name = item["genres"]["name"]
            if c_id not in genres_map:
                genres_map[c_id] = []
            genres_map[c_id].append(g_name)
            
        for c in comics:
            c["genres"] = genres_map.get(c["id"], [])
            
        return comics
    except Exception as e:
        print(f"[Error] Error get_comics_by_genre_id: {e}")
        return []
