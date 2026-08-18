# 📚 HManga-library

Website đọc truyện tranh cá nhân — lưu trữ và đọc manga/manhwa/manhua từ nhiều nguồn.

## 🏗️ Kiến trúc

```
HManga-library/
├── backend/          ← FastAPI (Python) — Modular Monolith
├── frontend/         ← Next.js (App Router) + TailwindCSS
├── cover-images/     ← Ảnh bìa tải về local
├── database_schema.sql
└── .env              ← Supabase credentials
```

| Thành phần | Công nghệ | Port |
|---|---|---|
| Frontend | Next.js 16 + TailwindCSS | `3000` |
| Backend | FastAPI + Uvicorn | `8000` |
| Database | Supabase (PostgreSQL) | Cloud |

---

## ⚡ Hướng dẫn chạy

### Bước 1: Cài đặt Python dependencies

Mở terminal, chạy:

```powershell
cd D:\AI_My_Project\HManga-library\backend
pip install -r requirements.txt
```

### Bước 2: Cài đặt Node.js dependencies

Mở **terminal mới**, chạy:

```powershell
cd D:\AI_My_Project\HManga-library\frontend
npm install
```

### Bước 3: Khởi chạy Backend (Terminal 1)

```powershell
cd D:\AI_My_Project\HManga-library\backend
uvicorn main:app --reload
```

Khi thấy dòng này là backend đã sẵn sàng:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Bước 4: Khởi chạy Frontend (Terminal 2)

```powershell
cd D:\AI_My_Project\HManga-library\frontend
npm run dev
```

Khi thấy dòng này là frontend đã sẵn sàng:
```
▲ Next.js 16.x
- Local: http://localhost:3000
✓ Ready
```

### Bước 5: Mở trình duyệt

Truy cập: **http://localhost:3000**

---

## 📖 Cách sử dụng

### Thêm truyện mới

1. Bấm **"+ Thêm truyện"** trên thanh điều hướng
2. **Bước 1 — Kiểm tra URL**: Dán URL ảnh từ hentaifox (ví dụ: `https://i3.hentaifox.com/004/4029076/1t.jpg`) → Bấm **"Phân tích"**
3. Nhập **tổng số trang** → Bấm **"Cập nhật danh sách"**
4. Bấm **"Test tải ảnh"** để kiểm tra ảnh load được không
5. Bấm **"Xác nhận sử dụng URL này"**
6. **Bước 2 — Thông tin truyện**: Điền tên, tác giả, chọn loại (multi/oneshot), trạng thái, nhập tag
7. **Bước 3 — Chương**: Chọn số chương
8. Bấm **"Lưu truyện"**

### Đọc truyện

1. Click vào **card truyện** trên trang chủ
2. Click vào **chapter** trong danh sách
3. Chuyển đổi chế độ đọc bằng nút **"📜 Cuộn dọc"** hoặc **"📄 Theo trang"**
4. Ở chế độ theo trang: dùng phím **←/→** hoặc nút Prev/Next

### Tìm kiếm

Bấm **"🔍 Tìm kiếm"** → nhập tên truyện, tác giả, tag, hoặc chọn trạng thái

### Xóa truyện / chapter

Vào trang chi tiết truyện → bấm **"🗑 Xóa truyện"** hoặc nút **"✕"** bên cạnh chapter

---

## 🔧 Cấu hình

### File `.env` (thư mục gốc)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### File `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🗄️ Database

Schema SQL nằm trong file `database_schema.sql`. Nếu cần tạo lại database:

1. Mở [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Copy nội dung `database_schema.sql` → chạy

### Các bảng

| Bảng | Mô tả |
|---|---|
| `comics` | Thông tin bộ truyện (tên, tác giả, loại, trạng thái, cover) |
| `tags` | Danh sách tag/thể loại |
| `comic_tags` | Liên kết truyện ↔ tag |
| `chapters` | Các chương truyện (base_url + total_pages) |

---

## 💡 Cách lưu trữ ảnh

Hệ thống **KHÔNG tải toàn bộ ảnh về máy**. Thay vào đó:

1. Database chỉ lưu **URL trang đầu tiên** (`base_url`) + **số trang** (`total_pages`) của mỗi chapter
2. Khi đọc, hệ thống **render URL động** bằng cách thay số trang:
   ```
   base_url:    https://i3.hentaifox.com/004/4029076/1t.jpg
   Trang 2:     https://i3.hentaifox.com/004/4029076/2t.jpg
   Trang 3:     https://i3.hentaifox.com/004/4029076/3t.jpg
   ...
   ```
3. Frontend hiển thị ảnh trực tiếp từ CDN nguồn với `referrerpolicy="no-referrer"`
4. **Chỉ ảnh bìa** (cover) được tải về local, đặt tên theo gallery_id (ví dụ: `4029076.jpg`)

---

## 📁 Cấu trúc chi tiết

### Backend (FastAPI — Modular Monolith)
```
backend/
├── main.py                    # App chính, CORS, router
├── requirements.txt
├── core/
│   ├── config.py              # Đọc .env
│   └── database.py            # Supabase client
├── modules/
│   ├── comics/                # CRUD bộ truyện
│   ├── chapters/              # CRUD chương + render URL
│   ├── images/                # Download cover
│   └── search/                # Tìm kiếm & lọc
└── cache/
    └── comics_cache.json      # Cache tự động rebuild
```

### Frontend (Next.js App Router)
```
frontend/src/
├── app/
│   ├── page.tsx               # Trang chủ — lưới truyện
│   ├── comics/add/page.tsx    # Thêm truyện
│   ├── comics/[id]/page.tsx   # Chi tiết truyện
│   ├── chapter/[id]/page.tsx  # Đọc chapter
│   └── search/page.tsx        # Tìm kiếm
├── components/
│   ├── ComicCard.tsx          # Card truyện
│   ├── ChapterReader.tsx      # Reader (2 chế độ)
│   ├── UrlChecker.tsx         # Phân tích URL
│   └── TagInput.tsx           # Nhập tag tự do
└── lib/
    ├── api.ts                 # API client
    ├── types.ts               # TypeScript types
    └── url-parser.ts          # Parse URL hentaifox
```
