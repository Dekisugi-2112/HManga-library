# 📚 HManga-library

Website đọc truyện tranh cá nhân — lưu trữ và đọc manga/manhwa/manhua từ nhiều nguồn (tối ưu cho NHentai).

---

## 🏗️ Kiến trúc

```
HManga-library/
├── backend/                ← FastAPI (Python) — Modular Monolith
│   ├── core/               ← Config & Database connection
│   ├── modules/            ← Comics, Chapters, Genres, Authors, Images, Search
│   ├── main.py             ← Entry point
│   ├── restore_from_cache.py ← Script khôi phục dữ liệu
│   └── requirements.txt
├── frontend/               ← HTML5 + Modern Dark CSS + Vanilla JS
├── cover-images/           ← Ảnh bìa tải về local (đặt theo gallery_id)
├── comics_cache.json       ← File backup dữ liệu (tự động cập nhật)
├── database_schema.sql     ← SQL tạo bảng cho Supabase
├── .env.example            ← Mẫu cấu hình biến môi trường
└── .env                    ← Supabase credentials (không commit)
```

| Thành phần | Công nghệ | Port |
|---|---|---|
| Frontend | HTML5 + CSS3 + Vanilla JS (Dark theme) | `8000` (FastAPI serve trực tiếp) |
| Backend | FastAPI + Uvicorn | `8000` |
| Database | Supabase (PostgreSQL) | Cloud |

---

## ⚡ Cài đặt & Chạy lần đầu (Fresh Clone)

### Bước 1: Clone repository

```powershell
git clone https://github.com/Dekisugi-2112/HManga-library.git
cd HManga-library
```

### Bước 2: Tạo file `.env`

Sao chép file mẫu và điền thông tin Supabase:

```powershell
copy .env.example .env
```

Mở file `.env` và điền:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Lấy thông tin tại:** [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API

### Bước 3: Tạo Database

1. Mở **Supabase Dashboard** → **SQL Editor**.
2. Copy toàn bộ nội dung file `database_schema.sql` và chạy.
3. Các bảng `comics`, `genres`, `comic_genres`, `chapters` sẽ được tạo tự động.

### Bước 4: Cài đặt Python dependencies

```powershell
cd backend
pip install -r requirements.txt
```

### Bước 5: Khôi phục dữ liệu từ backup

```powershell
cd backend
python restore_from_cache.py
```

Script sẽ tự động:
- ✅ Phục hồi toàn bộ truyện, thể loại, chương vào Supabase
- ✅ Tải lại ảnh bìa bị thiếu về `cover-images/`
- ✅ Reset auto-increment sequences
- ✅ Đồng bộ lại file `comics_cache.json`

### Bước 6: Khởi chạy Server

```powershell
cd backend
uvicorn main:app --reload
```

Khi thấy thông báo sau là hệ thống đã sẵn sàng:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Bước 7: Mở trình duyệt

Truy cập: **http://localhost:8000** (hoặc `http://127.0.0.1:8000`)

*(Không cần cài đặt Node.js hay chạy thêm terminal nào khác!)*

---

## 🔄 Khôi phục dữ liệu từ Backup (Disaster Recovery)

Khi cần khôi phục dữ liệu (xóa DB, tạo Supabase mới, hoặc clone lại về máy mới):

1. Đảm bảo file `.env` đã có thông tin Supabase mới.
2. Chạy `database_schema.sql` trong **Supabase SQL Editor**.
3. Chạy script khôi phục:

```powershell
cd backend
python restore_from_cache.py
```

> **Lưu ý:** Nếu gặp lỗi trùng ID khi thêm truyện mới sau khi khôi phục, chạy SQL sau trong Supabase SQL Editor:
> ```sql
> SELECT setval('comics_id_seq', COALESCE((SELECT MAX(id) FROM comics), 0) + 1, false);
> SELECT setval('chapters_id_seq', COALESCE((SELECT MAX(id) FROM chapters), 0) + 1, false);
> SELECT setval('genres_id_seq', COALESCE((SELECT MAX(id) FROM genres), 0) + 1, false);
> ```

---

## 📖 Tính năng & Cách sử dụng

### 1. Thêm truyện mới (`/add.html`)
1. Bấm **"+ Thêm truyện"** trên thanh điều hướng.
2. **Kiểm tra URL**: Dán link ảnh từ NHentai (VD: `https://t3.nhentai.net/galleries/4126277/1t.webp`) → Bấm **"Phân tích"**.
3. Hệ thống tự động bóc tách `gallery_id` và kiểm tra trùng lặp:
   - **Đã có trong thư viện**: Cho phép thêm chương mới ngay.
   - **Chưa có**: Nhập số trang → Bấm **"Cập nhật danh sách trang"** → **"Test tải 3 trang đầu"** để kiểm tra.
4. Điền tên truyện (có **kiểm tra trùng tên thông minh** real-time).
5. Chọn/nhập tác giả (có gợi ý tự động).
6. **Chọn thể loại**: Bấm chọn trực tiếp từ danh sách chips.
7. Bấm **"Lưu & Thêm Truyện Vào Thư Viện"**. Ảnh bìa tự động tải về `cover-images/`.

### 2. Đọc truyện (`/reader.html`)
- **📜 Cuộn dọc (Webtoon)**: Tải toàn bộ ảnh theo chiều dọc.
- **📄 Từng trang (Manga)**: Xem từng ảnh, dùng phím mũi tên ← / → trên bàn phím.
- Nút **⇦ Chương trước** và **Chương sau ⇨** ở chân trang.

### 3. Quản lý Thể loại (`/genres.html`)
- CRUD thể loại đầy đủ: Thêm, Sửa tên, Xóa.
- Xem truyện theo thể loại.

### 4. Quản lý Tác giả (`/authors.html`)
- Danh sách tác giả kèm số lượng tác phẩm.
- Đổi tên tác giả hàng loạt.

### 5. Quản lý truyện & chương (`/detail.html`)
- Sửa thông tin truyện, sửa/xóa/thêm chương.
- Xóa truyện tự động dọn dẹp DB + ảnh bìa.

### 6. Tìm kiếm & Lọc (`/search.html`)
- Tìm theo: Tên truyện, Tác giả, Thể loại.

---

## 🔧 Cấu hình biến môi trường (`.env`)

```env
# Bắt buộc
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Tùy chọn
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
COVER_IMAGES_DIR=cover-images
CACHE_FILE=comics_cache.json
```

---

## 🗄️ Database Schema

| Bảng | Mô tả |
|---|---|
| `comics` | Thông tin bộ truyện (tên, tác giả, cover, gallery_id) |
| `genres` | Danh sách thể loại (UNIQUE name) |
| `comic_genres` | Bảng liên kết nhiều-nhiều giữa truyện và thể loại |
| `chapters` | Chương truyện (`base_url` + `start_page` + `end_page`) |

---

## 💡 Cơ chế lưu trữ ảnh không tốn dung lượng

1. **Không tải toàn bộ ảnh chương về máy**.
2. Database chỉ lưu **URL trang đầu tiên** (`base_url`) và **khoảng trang** (`start_page` → `end_page`).
3. Khi đọc, frontend **render dãy URL động**:
   ```
   Trang 1: https://i.nhentai.net/galleries/4126277/1.webp
   Trang 2: https://i.nhentai.net/galleries/4126277/2.webp
   ...
   ```
4. Frontend tải ảnh trực tiếp qua CDN nguồn với `referrerpolicy="no-referrer"`.
5. **Smart Fallback**: Nếu ảnh `.webp` lỗi, tự động thử `.jpg` → `.png` → `.jpeg` → ảnh dự phòng `rem.jpg`.
6. **Chỉ ảnh bìa** được tải về local `cover-images/` đặt theo `gallery_id`.
