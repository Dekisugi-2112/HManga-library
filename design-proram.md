# 📚 TÀI LIỆU THIẾT KẾ & TỔNG HỢP DỰ ÁN — HMANGA-LIBRARY

---

## 1. MÔ TẢ DỰ ÁN & MỤC TIÊU
- **Tên dự án**: HManga-library
- **Mục đích**: Website cá nhân phục vụ việc lưu trữ, quản lý và đọc truyện tranh (manga/manhwa/manhua) được chọn lọc từ các nguồn bên ngoài (tối ưu cho `hentaifox.com`).
- **Đối tượng sử dụng**: 1 người dùng duy nhất (không cần hệ thống xác thực / auth / đăng nhập).
- **Mô hình kiến trúc**: **Modular Monolith** — Backend phân chia rõ theo từng domain module (`comics`, `chapters`, `images`, `search`, `genres`, `authors`) chạy trong một service FastAPI duy nhất; Frontend sử dụng HTML5 + CSS3 + Vanilla JavaScript thuần (Dark theme, siêu nhẹ, không cần Node.js, được serve trực tiếp bởi FastAPI).

---

## 2. KIẾN TRÚC LƯU TRỮ & XỬ LÝ DỮ LIỆU CỐT LÕI

### 2.1. Giải pháp lưu trữ ảnh không tốn dung lượng
- **Không tải toàn bộ ảnh chương về máy**: Tránh tốn dung lượng ổ cứng và băng thông server.
- **Không upload ảnh lên Cloud Storage**: Tiết kiệm chi phí lưu trữ đám mây.
- **Lưu trữ tinh gọn trong Database**: 
  - Mỗi chapter chỉ lưu **URL của trang đầu tiên (`base_url`)** và **tổng số trang (`total_pages`)**.
  - Ví dụ: `base_url = "https://i3.hentaifox.com/004/4029076/1t.jpg"`, `total_pages = 25`.
- **Render ảnh động (Dynamic URL Generation)**:
  - Khi đọc truyện, hệ thống phân tích `base_url` để trích xuất tiền tố, số trang, hậu tố và đuôi file (`.jpg`, `.webp`, `.png`).
  - Tự động sinh ra danh sách `[1t.jpg, 2t.jpg, ..., 25t.jpg]`.
  - Frontend nhúng thẻ `<img>` kèm thuộc tính `referrerpolicy="no-referrer"` để vượt qua cơ chế chống hotlink của máy chủ nguồn.

### 2.2. Quy chuẩn ảnh bìa (Cover Image)
- Khi thêm chương đầu tiên, ảnh của trang đầu tiên được tải về local.
- **Quy tắc đặt tên file**: Lấy `gallery_id` từ URL (ví dụ: `https://.../4029076/1t.jpg` $\rightarrow$ `cover-images/4029076.jpg`).
- Phục vụ qua endpoint static: `/api/covers/{filename}`.
- Khi xóa truyện, hệ thống tự động xóa file ảnh bìa tương ứng khỏi ổ đĩa.
- Nếu ảnh bìa bị lỗi/chưa có, giao diện hiển thị ảnh giữ chỗ dự phòng: `/rem.jpg`.

### 2.3. Hệ thống Cache JSON
- File cache: `backend/cache/comics_cache.json`.
- Tự động rebuild và lưu cấu trúc toàn bộ danh mục truyện, thể loại, chương và metadata mỗi khi có thao tác Thêm / Sửa / Xóa.

---

## 3. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

| Thành phần | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3 (Modern Dark Theme), Vanilla JS | Nhẹ, không cần build step, chạy trực tiếp từ FastAPI |
| **Backend** | FastAPI (Python 3.13+), Uvicorn | Kiến trúc Modular Monolith, Pydantic, HTTPX, Aiofiles |
| **Database** | Supabase (PostgreSQL) | Bảng `comics`, `genres`, `comic_genres`, `chapters` + Triggers |
| **Lưu trữ cover** | Local Disk Storage (`cover-images/`) | Tự động đồng bộ theo `gallery_id` |

---

## 4. CẤU TRÚC THƯ MỤC DỰ ÁN

```
HManga-library/
├── backend/
│   ├── main.py                    # Entry point FastAPI, mount static Frontend & Covers
│   ├── requirements.txt           # Danh sách thư viện Python
│   ├── cache/
│   │   └── comics_cache.json      # File cache tự động cập nhật
│   ├── core/
│   │   ├── config.py              # Đọc biến môi trường (.env)
│   │   └── database.py            # Singleton Supabase Client
│   └── modules/
│       ├── comics/                # Quản lý truyện (CRUD, Cache)
│       ├── chapters/              # Quản lý chương & Render URL động
│       ├── images/                # Download cover & Serve ảnh bìa
│       ├── search/                # Tìm kiếm và lọc nâng cao
│       ├── genres/                # Quản lý thể loại (genres)
│       └── authors/               # Quản lý tác giả
│
├── frontend/
│   ├── index.html                 # Trang chủ: Lưới truyện, tìm nhanh
│   ├── add.html                   # Thêm truyện: URL Checker + Chọn thể loại trực quan
│   ├── detail.html                # Chi tiết truyện: Sửa metadata, sửa/thêm/xóa chapter
│   ├── genres.html                # Quản lý thể loại: Thêm/Sửa/Xóa thể loại, xem truyện theo thể loại
│   ├── authors.html               # Quản lý tác giả: Xem danh sách, đổi tên hàng loạt
│   ├── reader.html                # Trình đọc truyện: 2 chế độ (cuộn dọc/từng trang), điều hướng
│   ├── search.html                # Tìm kiếm theo tên, tác giả, thể loại
│   ├── style.css                  # Giao diện Dark theme hiện đại, responsive
│   ├── app.js                     # API Client, Genre Selector, Toast Notification
│   ├── rem.jpg                    # Ảnh placeholder khi lỗi bìa
│   └── data-icon/                 # Thư mục icon giao diện
│
├── cover-images/                  # Thư mục lưu ảnh bìa theo gallery_id
├── check_url.html                 # Công cụ HTML kiểm thử URL độc lập
├── database_schema.sql            # Mã nguồn tạo bảng PostgreSQL trên Supabase
├── design-proram.md              # File tài liệu thiết kế tổng hợp
├── README.md                      # Hướng dẫn cài đặt và vận hành
├── .env                           # File cấu hình bí mật (Supabase Keys)
├── .env.example                   # File mẫu cấu hình biến môi trường
└── .gitignore                     # Bỏ qua file nhạy cảm, cache, venv
```

---

## 5. DATABASE SCHEMA (SUPABASE POSTGRESQL)

```sql
-- 1. Bảng truyện (ID tự tăng theo thứ tự thêm vào: 1, 2, 3...)
CREATE TABLE public.comics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    cover_filename VARCHAR(100),                     -- ví dụ: "4029076.jpg"
    source_url TEXT                                  -- link tham khảo gốc
);

-- 2. Bảng thể loại (genres)
CREATE TABLE public.genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 3. Bảng liên kết truyện & thể loại (Many-to-Many)
CREATE TABLE public.comic_genres (
    comic_id INT REFERENCES public.comics(id) ON DELETE CASCADE,
    genre_id INT REFERENCES public.genres(id) ON DELETE CASCADE,
    PRIMARY KEY (comic_id, genre_id)
);

-- 4. Bảng chương truyện
CREATE TABLE public.chapters (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL REFERENCES public.comics(id) ON DELETE CASCADE,
    chapter_number NUMERIC(6,1) NOT NULL,
    title VARCHAR(255),                              -- Tùy chọn tên chương
    base_url TEXT NOT NULL,                          -- URL ảnh trang 1
    total_pages INT NOT NULL,                        -- Số trang của chapter
    UNIQUE (comic_id, chapter_number)
);
```

---

## 6. DANH SÁCH TÍNH NĂNG ĐÃ HOÀN THÀNH (FEATURES IMPLEMENTED)

### 6.1. Thêm truyện thông minh (`/add.html`)
- **Tích hợp `UrlChecker`**:
  - Dán URL từ hentaifox (VD: `https://i3.hentaifox.com/004/4029076/1t.jpg`).
  - Tự động bóc tách `gallery_id`, số trang, hậu tố (`t`), đuôi ảnh (`.jpg`, `.webp`).
  - Nhập **Tổng số trang** tự do, không bị reset.
  - Nút **"🧪 Test tải 3 trang đầu"** để kiểm tra link ảnh.
- **Kiểm tra trùng lặp (`gallery_id`)**:
  - Tra cứu DB theo `gallery_id`. Nếu đã có, cho phép bấm **"Thêm chương mới vào bộ này"**.
- **Chọn thể loại trực quan (Genre Selector Chips)**:
  - Hiển thị danh sách tất cả các thể loại có sẵn dưới dạng nút bấm/chips.
  - Người dùng **chỉ cần bấm chọn thể loại**, không cần gõ chữ.
  - Hỗ trợ chọn nhiều thể loại cùng lúc (bấm để bật/tắt chọn).
  - Có link dẫn sang trang Quản lý thể loại để thêm thể loại mới bất kỳ lúc nào.
- **Gợi ý tác giả**: Tự động gợi ý tên tác giả từ cơ sở dữ liệu.
- **Tự động tải Cover**: Tải ảnh trang 1 về `cover-images/{gallery_id}.jpg`.

### 6.2. Quản lý Thể loại (`/genres.html`)
- Thống kê danh sách thể loại kèm **số lượng truyện** tương ứng.
- Thêm thể loại mới.
- **✏️ Đổi tên thể loại**: Tự động đồng bộ trên toàn bộ truyện liên quan.
- **🗑️ Xóa thể loại**: Gỡ liên kết thể loại an toàn khỏi database.
- **Xem truyện theo thể loại**: Nhấp vào thể loại để lọc và xem danh sách truyện ngay bên dưới.

### 6.3. Quản lý Tác giả (`/authors.html`)
- Thống kê toàn bộ tác giả có trong thư viện và số lượng bộ truyện của họ.
- **✏️ Đổi tên tác giả hàng loạt**: Cập nhật tên mới cho toàn bộ các truyện của tác giả đó.
- Xem danh sách toàn bộ tác phẩm của từng tác giả.

### 6.4. Trang chủ (`/index.html`)
- Hiển thị toàn bộ truyện dạng lưới card Dark mode, sắp xếp theo ID thêm vào (1, 2, 3...).
- Thẻ truyện hiển thị: Ảnh bìa, Tên truyện, Tác giả, và các Thể loại.
- Thanh tìm kiếm nhanh theo tên truyện.

### 6.5. Chi tiết truyện & Quản lý chương (`/detail.html`)
- Xem metadata, ID thứ tự truyện, ảnh bìa, các thể loại của truyện.
- Danh sách các chương sắp xếp theo thứ tự số chương tăng dần (`Ch.1`, `Ch.2`...).
- **Modal Sửa thông tin truyện**: Sửa tên, tác giả (có gợi ý), chọn lại thể loại bằng nút bấm chọn thể loại trực quan.
- **Modal Sửa chương**: Đổi số chương (ví dụ chuyển chương 1 thành 2, 1.5...) và đổi tên chương.
- **Modal Thêm chương mới**: Tích hợp `UrlChecker` để thêm chương trực tiếp cho bộ truyện này.
- **Xóa chương & Xóa truyện**: Có xác nhận an toàn; khi xóa truyện sẽ tự động xóa file cover local.

### 6.6. Trình đọc truyện chuyên dụng (`/reader.html`)
- **2 chế độ đọc linh hoạt**:
  - **📜 Cuộn dọc (Webtoon style)**: Tải toàn bộ ảnh theo chiều dọc, hỗ trợ lazy-load.
  - **📄 Theo từng trang (Manga style)**: Hiển thị 1 ảnh giữa màn hình, có nút Trang trước / Trang sau, hỗ trợ phím mũi tên bàn phím (`←` / `→`).
- **Thanh điều hướng chương hoàn chỉnh**:
  - Nút **⇦ Chương trước** (tự ẩn nếu đang ở chương đầu).
  - Nút **Chương sau ⇨** (tự ẩn nếu đang ở chương cuối).
  - Nút quay lại trang thông tin chi tiết của bộ truyện.
- Hiển thị tên truyện, số chương, tổng số trang trên header cố định.

### 6.7. Tìm kiếm & Lọc (`/search.html`)
- Tìm kiếm đồng thời theo: Tên truyện, Tác giả, Thể loại (dropdown chọn thể loại).
- Trả về kết quả dưới dạng lưới thẻ truyện trực quan.

---

## 7. HƯỚNG DẪN VẬN HÀNH NHANH

### Khởi chạy Server (Port 8000)
```powershell
cd D:\AI_My_Project\HManga-library\backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Truy cập: **`http://localhost:8000`**