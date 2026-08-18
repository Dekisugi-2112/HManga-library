"""
Comics Service Module
=====================
Xử lý toàn bộ nghiệp vụ CRUD và logic liên quan đến truyện tranh (Comics).
"""

import json
from pathlib import Path
from core.database import supabase
from modules.comics.schemas import ComicCreate, ComicUpdate

# Đường dẫn đến file lưu trữ cache truyện cục bộ
CACHE_DIR = Path(__file__).parent.parent.parent / "cache"
CACHE_FILE = CACHE_DIR / "comics_cache.json"

def get_all_comics(genre: str = None, q: str = None):
    query = supabase.table("comics").select("*").order("id", desc=False)
    if q:
        query = query.ilike("title", f"%{q}%")
    
    response = query.execute()
    comics = response.data or []
    
    comic_ids = [c["id"] for c in comics]
    if not comic_ids:
        return []
        
    genres_map = {}
    try:
        genres_response = supabase.table("comic_genres").select("comic_id, genres(name)").in_("comic_id", comic_ids).execute()
        for item in genres_response.data or []:
            c_id = item["comic_id"]
            genre_name = item["genres"]["name"]
            if c_id not in genres_map:
                genres_map[c_id] = []
            genres_map[c_id].append(genre_name)
    except Exception as e:
        print(f"[Warning] Error fetching comic_genres: {e}")
        
    result = []
    for comic in comics:
        comic["genres"] = genres_map.get(comic["id"], [])
        if genre and genre not in comic["genres"]:
            continue
        result.append(comic)
        
    return result

def get_comic_detail(comic_id: int):
    response = supabase.table("comics").select("*").eq("id", comic_id).execute()
    if not response.data:
        return None
    comic = response.data[0]
    
    comic["genres"] = []
    try:
        genres_response = supabase.table("comic_genres").select("genres(name)").eq("comic_id", comic_id).execute()
        comic["genres"] = [item["genres"]["name"] for item in genres_response.data or []]
    except Exception as e:
        print(f"[Warning] Error fetching comic_genres: {e}")
    
    try:
        chapters_response = supabase.table("chapters").select("*").eq("comic_id", comic_id).order("chapter_number").execute()
        comic["chapters"] = chapters_response.data or []
    except Exception as e:
        comic["chapters"] = []
    
    return comic

def create_comic(comic_data: ComicCreate):
    genre_ids = []
    for genre_name in comic_data.genres:
        clean_name = genre_name.strip()
        try:
            genre_res = supabase.table("genres").select("id").ilike("name", clean_name).execute()
            if genre_res.data:
                genre_ids.append(genre_res.data[0]["id"])
            else:
                new_genre = supabase.table("genres").insert({"name": clean_name}).execute()
                if new_genre.data:
                    genre_ids.append(new_genre.data[0]["id"])
        except Exception as e:
            print(f"[Warning] Error finding/creating genre: {e}")
            
    comic_dict = comic_data.dict(exclude={"genres"})
    response = supabase.table("comics").insert(comic_dict).execute()
    new_comic = response.data[0]
    
    for g_id in genre_ids:
        try:
            supabase.table("comic_genres").insert({"comic_id": new_comic["id"], "genre_id": g_id}).execute()
        except Exception as e:
            print(f"[Warning] Error linking comic_genre: {e}")
        
    update_cache()
    return get_comic_detail(new_comic["id"])

def update_comic(comic_id: int, comic_data: ComicUpdate):
    comic_dict = {k: v for k, v in comic_data.dict(exclude={"genres"}).items() if v is not None}
    if comic_dict:
        supabase.table("comics").update(comic_dict).eq("id", comic_id).execute()
    
    if comic_data.genres is not None:
        try:
            supabase.table("comic_genres").delete().eq("comic_id", comic_id).execute()
            genre_ids = []
            for genre_name in comic_data.genres:
                clean_name = genre_name.strip()
                genre_res = supabase.table("genres").select("id").ilike("name", clean_name).execute()
                if genre_res.data:
                    genre_ids.append(genre_res.data[0]["id"])
                else:
                    new_genre = supabase.table("genres").insert({"name": clean_name}).execute()
                    if new_genre.data:
                        genre_ids.append(new_genre.data[0]["id"])
                    
            for g_id in genre_ids:
                supabase.table("comic_genres").insert({"comic_id": comic_id, "genre_id": g_id}).execute()
        except Exception as e:
            print(f"[Warning] Error updating comic_genres: {e}")
        
    update_cache()
    return get_comic_detail(comic_id)

def delete_comic(comic_id: int):
    comic_res = supabase.table("comics").select("cover_filename").eq("id", comic_id).execute()
    cover_filename = comic_res.data[0]["cover_filename"] if comic_res.data else None
    
    try:
        supabase.table("chapters").delete().eq("comic_id", comic_id).execute()
    except:
        pass
    try:
        supabase.table("comic_genres").delete().eq("comic_id", comic_id).execute()
    except:
        pass
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
        comic["genres"] = []
        try:
            genres_response = supabase.table("comic_genres").select("genres(name)").eq("comic_id", comic["id"]).execute()
            comic["genres"] = [item["genres"]["name"] for item in genres_response.data or []]
        except:
            pass
        try:
            chapters_response = supabase.table("chapters").select("*").eq("comic_id", comic["id"]).order("chapter_number").execute()
            comic["chapters"] = chapters_response.data or []
        except:
            comic["chapters"] = []
        return comic
    return None

def update_cache():
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        comics = get_all_comics()
        for comic in comics:
            try:
                chapters = supabase.table("chapters").select("*").eq("comic_id", comic["id"]).order("chapter_number").execute()
                comic["chapters"] = chapters.data or []
            except:
                comic["chapters"] = []
            
        from datetime import datetime
        cache_data = {
            "comics": comics,
            "last_updated": datetime.utcnow().isoformat() + "Z"
        }
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[Warning] Error update_cache: {e}")
