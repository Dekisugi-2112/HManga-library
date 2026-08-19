"""
Comics Service Module
=====================
Xử lý toàn bộ logic nghiệp vụ (CRUD) liên quan đến bộ truyện (Comics):
1. Lấy danh sách truyện (kèm thể loại, hỗ trợ lọc theo thể loại và tìm kiếm tên).
2. Lấy chi tiết một bộ truyện kèm danh sách các chương (chapters) và thể loại.
3. Tạo truyện mới và tự động liên kết các thể loại được chọn trong bảng `comic_genres`.
4. Cập nhật thông tin truyện và cập nhật lại danh sách thể loại liên kết.
5. Xóa truyện (tự động dọn dẹp chapters, liên kết thể loại và xóa file ảnh bìa local).
6. Kiểm tra truyện đã tồn tại theo gallery_id của hentaifox.
7. Đồng bộ dữ liệu ra file cache JSON cục bộ.
"""

import json
from pathlib import Path
from core.database import supabase
from modules.comics.schemas import ComicCreate, ComicUpdate

# Đường dẫn đến file lưu trữ cache truyện cục bộ
CACHE_DIR = Path(__file__).parent.parent.parent / "cache"
CACHE_FILE = CACHE_DIR / "comics_cache.json"

def get_all_comics(genre: str = None, q: str = None):
    """
    Lấy danh sách tất cả các bộ truyện trong thư viện:
    - Sắp xếp theo ID tăng dần (1, 2, 3... theo thứ tự thêm vào).
    - Hỗ trợ lọc theo từ khóa tiêu đề (q) không phân biệt hoa thường.
    - Tự động map danh sách thể loại từ bảng `comic_genres` cho từng bộ truyện.
    - Hỗ trợ lọc theo tên thể loại (genre).
    """
    # 1. Truy vấn danh sách truyện từ bảng comics
    query = supabase.table("comics").select("*").order("id", desc=False)
    if q:
        query = query.ilike("title", f"%{q}%")
    
    response = query.execute()
    comics = response.data or []
    
    comic_ids = [c["id"] for c in comics]
    if not comic_ids:
        return []
        
    # 2. Truy vấn danh sách thể loại tương ứng cho các bộ truyện theo lô (batch query)
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
        
    # 3. Gắn danh sách thể loại vào từng object truyện và lọc theo thể loại nếu được yêu cầu
    result = []
    for comic in comics:
        comic["genres"] = genres_map.get(comic["id"], [])
        # Nếu có lọc theo thể loại mà truyện không chứa thể loại đó thì bỏ qua
        if genre and genre not in comic["genres"]:
            continue
        result.append(comic)
        
    return result

def get_comic_detail(comic_id: int):
    """
    Lấy thông tin chi tiết của 1 bộ truyện theo ID:
    - Thông tin truyện cơ bản (id, title, author, cover_filename, source_url).
    - Danh sách thể loại (genres) của bộ truyện.
    - Danh sách các chương (chapters) đã sắp xếp theo thứ tự chapter_number tăng dần.
    """
    # 1. Lấy thông tin cơ bản từ bảng comics
    response = supabase.table("comics").select("*").eq("id", comic_id).execute()
    if not response.data:
        return None
    comic = response.data[0]
    
    # 2. Lấy danh sách thể loại từ bảng comic_genres
    comic["genres"] = []
    try:
        genres_response = supabase.table("comic_genres").select("genres(name)").eq("comic_id", comic_id).execute()
        comic["genres"] = [item["genres"]["name"] for item in genres_response.data or []]
    except Exception as e:
        print(f"[Warning] Error fetching comic_genres: {e}")
    
    # 3. Lấy danh sách các chapters thuộc bộ truyện
    try:
        chapters_response = supabase.table("chapters").select("*").eq("comic_id", comic_id).order("chapter_number").execute()
        chapters = chapters_response.data or []
        for ch in chapters:
            s_page = ch.get("start_page", 1) or 1
            e_page = ch.get("end_page", ch.get("total_pages", s_page)) or s_page
            ch["start_page"] = s_page
            ch["end_page"] = e_page
            ch["total_pages"] = max(1, e_page - s_page + 1)
        comic["chapters"] = chapters
    except Exception as e:
        comic["chapters"] = []
    
    return comic

def create_comic(comic_data: ComicCreate):
    """
    Tạo mới một bộ truyện:
    1. Tìm hoặc tự động tạo các thể loại trong bảng `genres` để lấy `genre_id`.
    2. Chèn bản ghi truyện vào bảng `comics`.
    3. Tạo liên kết giữa truyện và thể loại trong bảng `comic_genres`.
    4. Cập nhật lại file cache JSON.
    """
    # Bước 1: Lấy danh sách ID của các thể loại đã chọn
    genre_ids = []
    for genre_name in comic_data.genres:
        clean_name = genre_name.strip()
        try:
            genre_res = supabase.table("genres").select("id").ilike("name", clean_name).execute()
            if genre_res.data:
                genre_ids.append(genre_res.data[0]["id"])
            else:
                # Nếu thể loại chưa có sẵn thì tự động tạo mới
                new_genre = supabase.table("genres").insert({"name": clean_name}).execute()
                if new_genre.data:
                    genre_ids.append(new_genre.data[0]["id"])
        except Exception as e:
            print(f"[Warning] Error finding/creating genre: {e}")
            
    # Bước 2: Thêm truyện vào bảng comics (loại bỏ trường genres dạng mảng trước khi insert vào table comics)
    comic_dict = comic_data.dict(exclude={"genres"})
    response = supabase.table("comics").insert(comic_dict).execute()
    new_comic = response.data[0]
    
    # Bước 3: Thêm các bản ghi liên kết vào bảng trung gian comic_genres
    for g_id in genre_ids:
        try:
            supabase.table("comic_genres").insert({"comic_id": new_comic["id"], "genre_id": g_id}).execute()
        except Exception as e:
            print(f"[Warning] Error linking comic_genre: {e}")
        
    # Bước 4: Đồng bộ cache và trả về chi tiết bộ truyện vừa tạo
    update_cache()
    return get_comic_detail(new_comic["id"])

def update_comic(comic_id: int, comic_data: ComicUpdate):
    """
    Cập nhật thông tin của một bộ truyện:
    - Cập nhật các trường cơ bản (title, author, source_url) nếu có gửi lên.
    - Cập nhật lại danh sách thể loại trong bảng `comic_genres` nếu có truyền genres mới.
    - Đồng bộ lại cache JSON.
    """
    # 1. Cập nhật các trường cơ bản trong bảng comics
    comic_dict = {k: v for k, v in comic_data.dict(exclude={"genres"}).items() if v is not None}
    if comic_dict:
        supabase.table("comics").update(comic_dict).eq("id", comic_id).execute()
    
    # 2. Cập nhật lại các liên kết thể loại nếu có
    if comic_data.genres is not None:
        try:
            # Xóa các liên kết thể loại cũ
            supabase.table("comic_genres").delete().eq("comic_id", comic_id).execute()
            
            # Thêm các liên kết thể loại mới
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
    """
    Xóa vĩnh viễn một bộ truyện khỏi hệ thống:
    1. Lấy tên file ảnh bìa (cover_filename) để xóa file local.
    2. Xóa toàn bộ chapters thuộc bộ truyện.
    3. Xóa các liên kết thể loại trong `comic_genres`.
    4. Xóa bản ghi truyện trong bảng `comics`.
    5. Xóa file ảnh bìa vật lý trong thư mục `cover-images/`.
    6. Đồng bộ lại cache JSON.
    """
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
    
    # Xóa file ảnh bìa trên đĩa cứng
    if cover_filename:
        cover_path = Path(__file__).parent.parent.parent.parent / "cover-images" / cover_filename
        if cover_path.exists():
            cover_path.unlink()
    
    update_cache()

def check_comic_by_gallery_id(gallery_id: str):
    """
    Kiểm tra xem truyện tranh từ hentaifox đã tồn tại trong thư viện chưa
    thông qua ID gallery (VD: 4029076).
    - Tra cứu chuỗi `/{gallery_id}/` trong cột source_url.
    - Nếu đã có, trả về object chi tiết truyện kèm danh sách chương để người dùng có thể thêm tiếp chương.
    """
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
            chapters = chapters_response.data or []
            for ch in chapters:
                s_page = ch.get("start_page", 1) or 1
                e_page = ch.get("end_page", ch.get("total_pages", s_page)) or s_page
                ch["start_page"] = s_page
                ch["end_page"] = e_page
                ch["total_pages"] = max(1, e_page - s_page + 1)
            comic["chapters"] = chapters
        except:
            comic["chapters"] = []
        return comic
    return None

def update_cache():
    """
    Tạo hoặc cập nhật file JSON cache (`cache/comics_cache.json`).
    Lưu trữ danh sách toàn bộ truyện và chương nhằm hỗ trợ xem nhanh hoặc tra cứu ngoại tuyến.
    """
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
