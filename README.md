# 📚 HManga-library

Website đọc truyện tranh cá nhân — lưu trữ và đọc manga/manhwa/manhua từ nhiều nguồn (tối ưu cho hentaifox).

## 🏗️ Kiến trúc

```
HManga-library/
├── backend/          ← FastAPI (Python) — Modular Monolith
├── frontend/         ← HTML5 + Modern Dark CSS + Vanilla JS
├── cover-images/     ← Ảnh bìa tải về local (đặt theo gallery_id)
├── database_schema.sql
└── .env              ← Supabase credentials
```

| Thành phần | Công nghệ | Port |
|---|---|---|
| Frontend | HTML5 + CSS3 + Vanilla JS (Dark theme) | `8000` (FastAPI serve trực tiếp) |
| Backend | FastAPI + Uvicorn | `8000` |
| Database | Supabase (PostgreSQL) | Cloud |

---

## ⚡ Hướng dẫn chạy (Chỉ cần 1 lệnh duy nhất)

### Bước 1: Cài đặt Python dependencies

Mở terminal, chạy:

```powershell
cd D:\AI_My_Project\HManga-library\backend
pip install -r requirements.txt
```

### Bước 2: Khởi chạy Server

```powershell
cd D:\AI_My_Project\HManga-library\backend
uvicorn main:app --reload
```

Khi thấy thông báo sau là hệ thống đã sẵn sàng:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Bước 3: Mở trình duyệt

Truy cập: **http://localhost:8000** (hoặc `http://127.0.0.1:8000`)

*(Không cần cài đặt Node.js hay chạy thêm terminal nào khác!)*

---

## 📖 Tính năng & Cách sử dụng

### 1. Thêm truyện mới (`/add.html`)
1. Bấm **"+ Thêm truyện"** trên thanh điều hướng.
2. **Kiểm tra URL**: Dán link ảnh từ hentaifox (VD: `https://i3.hentaifox.com/004/4029076/1t.jpg`) $\rightarrow$ Bấm **"Phân tích"**.
3. Hệ thống sẽ tự động bóc tách `gallery_id` và kiểm tra xem truyện đã tồn tại chưa:
   - Nếu **đã có trong thư viện**: Cho phép thêm ngay chương mới vào bộ truyện đó.
   - Nếu **chưa có**: Nhập số trang $\rightarrow$ Bấm **"Cập nhật danh sách trang"** $\rightarrow$ Có thể bấm **"Test tải 3 trang đầu"** để kiểm tra.
4. Điền tên truyện, chọn/nhập tác giả (có gợi ý tự động), chọn/nhập thể loại (có gợi ý click chọn nhanh).
5. Bấm **"Lưu & Thêm Truyện Vào Thư Viện"**. Ảnh bìa sẽ tự động tải về `cover-images/{gallery_id}.jpg`.

### 2. Quản lý Thể loại / Tags (`/tags.html`)
- Xem danh sách tất cả các thể loại kèm **số lượng bộ truyện** của từng thể loại.
- **Thêm thể loại mới** nhanh chóng.
- **✏️ Đổi tên thể loại**: Cập nhật tên thể loại trên toàn hệ thống.
- **🗑️ Xóa thể loại**: Gỡ thể loại khỏi tất cả các bộ truyện.
- **Xem truyện theo thể loại**: Click vào bất kỳ thể loại nào để xem danh sách các bộ truyện thuộc thể loại đó.

### 3. Quản lý Tác giả (`/authors.html`)
- Xem danh sách tất cả các tác giả và số lượng tác phẩm tương ứng.
- **✏️ Đổi tên tác giả hàng loạt**: Cập nhật tên mới cho toàn bộ các truyện của tác giả đó.
- Click vào tác giả để xem toàn bộ danh mục truyện của tác giả đó.

### 4. Đọc truyện (`/reader.html`)
- Chuyển đổi giữa 2 chế độ đọc:
  - **📜 Cuộn dọc (Webtoon)**: Tải toàn bộ ảnh theo chiều dọc
  - **📄 Từng trang (Manga)**: Xem từng ảnh, bấm Next/Prev hoặc dùng **phím mũi tên $\leftarrow$ / $\rightarrow$** trên bàn phím
- Nút **⇦ Chương trước** và **Chương sau ⇨** ở chân trang giúp chuyển chương liền mạch.

### 5. Quản lý truyện & chương (Trang chi tiết `/detail.html`)
- **Sửa thông tin truyện**: Đổi tên, tác giả, chỉnh sửa danh sách tags.
- **Sửa chương**: Thay đổi số thứ tự chương (VD: chuyển chương 1 thành 2) và đổi tên chương.
- **Thêm chương mới**: Thêm chương trực tiếp từ trang chi tiết.
- **Xóa truyện**: Xóa toàn bộ dữ liệu trong DB và tự dọn dẹp file ảnh bìa local.

### 6. Tìm kiếm & Lọc (`/search.html`)
- Tìm kiếm kết hợp theo: Tên truyện, Tác giả, Thể loại/Tags.

---

## 🔧 Cấu hình biến môi trường (`.env`)

File `.env` nằm tại thư mục gốc:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 🗄️ Database

Schema SQL nằm trong file `database_schema.sql` gồm:
- `comics`: Thông tin bộ truyện (tên, tác giả, cover)
- `tags`: Danh sách thể loại
- `comic_tags`: Bảng liên kết n-n giữa truyện và tag
- `chapters`: Các chương truyện (`base_url` + `total_pages`)

---

## 💡 Cơ chế lưu trữ ảnh không tốn dung lượng

1. **Không tải toàn bộ ảnh chương về máy**.
2. Database chỉ lưu **URL trang đầu tiên** (`base_url`) và **số trang** (`total_pages`).
3. Khi đọc, backend/frontend **render dãy URL động**:
   ```
   Trang 1: https://i3.hentaifox.com/004/4029076/1t.jpg
   Trang 2: https://i3.hentaifox.com/004/4029076/2t.jpg
   ...
   ```
4. Frontend tải ảnh trực tiếp qua CDN nguồn với thuộc tính `referrerpolicy="no-referrer"`.
5. **Chỉ ảnh bìa** được tải về local `cover-images/` đặt theo `gallery_id` (VD: `4029076.jpg`). Nếu ảnh lỗi, tự động dùng ảnh dự phòng `rem.jpg`.
