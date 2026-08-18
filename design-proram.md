# 📚 TÀI LIỆU THIẾT KẾ & TỔNG HỢP DỰ ÁN — HMANGA-LIBRARY

---

## 1. MÔ TẢ DỰ ÁN & MỤC TIÊU
- **Tên dự án**: HManga-library
- **Mục đích**: Website cá nhân phục vụ việc lưu trữ, quản lý và đọc truyện tranh (manga/manhwa/manhua) được chọn lọc từ các nguồn bên ngoài (hiện tại tối ưu cho `hentaifox.com`).
- **Đối tượng sử dụng**: 1 người dùng duy nhất (không cần hệ thống xác thực / auth / đăng nhập).
- **Mô hình kiến trúc**: **Modular Monolith** — Backend phân chia rõ theo từng domain module nhưng chạy trong một service FastAPI duy nhất; Frontend sử dụng HTML5 + CSS3 + Vanilla JavaScript thuần (Dark theme, siêu nhẹ, không cần Node.js, được serve trực tiếp bởi FastAPI).

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
- Tự động rebuild và lưu cấu trúc toàn bộ danh mục truyện, tag, chương và metadata mỗi khi có thao tác Thêm / Sửa / Xóa.

---

## 3. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

| Thành phần | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3 (Modern Dark Theme), Vanilla JS | Nhẹ, không cần build step, chạy trực tiếp từ FastAPI |
| **Backend** | FastAPI (Python 3.13+), Uvicorn | Kiến trúc Modular Monolith, Pydantic, HTTPX, Aiofiles |
| **Database** | Supabase (PostgreSQL) | Bảng `comics`, `tags`, `comic_tags`, `chapters` + Triggers |
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
│       ├── comics/                # Quản lý truyện (CRUD, Tags, Cache)
│       ├── chapters/              # Quản lý chương & Render URL động
│       ├── images/                # Download cover & Serve ảnh bìa
│       └── search/                # Tìm kiếm và lọc nâng cao
│
├── frontend/
│   ├── index.html                 # Trang chủ: Lưới truyện, lọc trạng thái, tìm nhanh
│   ├── add.html                   # Thêm truyện: URL Checker + Check trùng + Form
│   ├── detail.html                # Chi tiết truyện: Sửa metadata, sửa/thêm/xóa chapter
│   ├── reader.html                # Trình đọc truyện: 2 chế độ (cuộn dọc/từng trang), điều hướng
│   ├── search.html                # Tìm kiếm & lọc kết hợp đa tiêu chí
│   ├── style.css                  # Giao diện Dark theme hiện đại, responsive
│   ├── app.js                     # API Client, Tag Input, Toast Notification
│   └── rem.jpg                    # Ảnh placeholder khi lỗi bìa
│
├── cover-images/                  # Thư mục lưu ảnh bìa theo gallery_id
├── check_url.html                 # Công cụ HTML kiểm thử URL độc lập
├── database_schema.sql            # Mã nguồn tạo bảng PostgreSQL trên Supabase
├── design-proram.md              # File tài liệu thiết kế tổng hợp
├── README.md                      # Hướng dẫn cài đặt và vận hành
├── .env                           # File cấu hình bí mật (Supabase Keys)
├── .env.example                   # File mẫu cấu hình biến môi trường
```

---

## 5. DATABASE SCHEMA (SUPABASE POSTGRESQL)

```sql
-- 1. Bảng truyện
CREATE TABLE public.comics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    type VARCHAR(20) NOT NULL DEFAULT 'multi',       -- 'multi' hoặc 'oneshot'
    status VARCHAR(20) NOT NULL DEFAULT 'ongoing',   -- 'ongoing' hoặc 'completed'
    cover_filename VARCHAR(100),                     -- ví dụ: "4029076.jpg"
    personal_note TEXT,                              -- ghi chú cá nhân
    source_url TEXT,                                 -- link tham khảo gốc
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng thể loại / tags
CREATE TABLE public.tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 3. Bảng liên kết truyện & tag (Many-to-Many)
CREATE TABLE public.comic_tags (
    comic_id INT REFERENCES public.comics(id) ON DELETE CASCADE,
    tag_id INT REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (comic_id, tag_id)
);

-- 4. Bảng chương truyện
CREATE TABLE public.chapters (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL REFERENCES public.comics(id) ON DELETE CASCADE,
    chapter_number NUMERIC(6,1) NOT NULL,
    title VARCHAR(255),                              -- Oneshot đặt là 'oneshot'
    base_url TEXT NOT NULL,                          -- URL ảnh trang 1
    total_pages INT NOT NULL,                        -- Số trang của chapter
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (comic_id, chapter_number)
);
```

---

## 6. DANH SÁCH TÍNH NĂNG ĐÃ HOÀN THÀNH (FEATURES IMPLEMENTED)

### 6.1. Thêm truyện thông minh (`/comics/add`)
- **Tích hợp `UrlChecker`**:
  - Dán một URL bất kỳ từ hentaifox (VD: `https://i3.hentaifox.com/004/4029076/1t.jpg`).
  - Hệ thống tự bóc tách `gallery_id`, số trang, hậu tố (`t`), đuôi ảnh (`.jpg`, `.webp`).
  - Ô nhập **Tổng số trang** cho phép nhập số tự do, không bị giới hạn cứng và không bị reset về 1.
  - Nút **"🧪 Test tải ảnh"**: Thử nghiệm tải trước 3 trang đầu bằng trình duyệt có `no-referrer` để đảm bảo link hoạt động.
- **Tự động kiểm tra trùng lặp (Gallery ID Check)**:
  - Khi dán URL, hệ thống tra cứu trong Database xem `gallery_id` đã tồn tại chưa.
  - **Nếu đã có**: Hiện cảnh báo và chuyển thành form **"Thêm chương mới vào bộ truyện này"**, tránh tạo trùng lặp bộ truyện.
  - **Nếu chưa có**: Hiển thị form nhập thông tin (Tên truyện, Tác giả, Loại `multi`/`oneshot`, Trạng thái, Tag tự do, Ghi chú).
- **Tự động tải Cover**: Tải ảnh trang đầu tiên về máy local lưu tên `{gallery_id}.{ext}`.

### 6.2. Trang chủ (`/`)
- Hiển thị danh mục truyện dạng lưới thẻ card Dark mode sang trọng.
- Thẻ truyện hiển thị: Ảnh bìa, Badge trạng thái (*Đang tiến hành* / *Hoàn thành*), Badge *Oneshot*, Tên truyện, Tác giả, và các Tag thu nhỏ.
- Bộ lọc nhanh theo trạng thái (*Tất cả*, *Đang tiến hành*, *Hoàn thành*) và thanh tìm kiếm nhanh.

### 6.3. Chi tiết truyện & Quản lý chương (`/comics/[id]`)
- Xem toàn bộ metadata, ảnh bìa, các tag thể loại và ghi chú cá nhân.
- Danh sách các chương sắp xếp theo thứ tự số chương tăng dần.
- **Modal Sửa thông tin truyện (Edit Comic)**: Thay đổi tên, tác giả, trạng thái, chỉnh sửa danh sách tag, cập nhật ghi chú.
- **Modal Sửa chương (Edit Chapter)**: Đổi số chương (ví dụ chuyển chương 1 thành 2, 1.5...) và đổi tên chương.
- **Modal Thêm chương mới (Add Chapter)**: Tích hợp sẵn `UrlChecker` để thêm chương trực tiếp cho bộ truyện này.
- **Xóa chương & Xóa truyện**: Có xác nhận an toàn; khi xóa truyện sẽ tự động xóa file cover local.

### 6.4. Trình đọc truyện chuyên dụng (`/chapter/[id]`)
- **2 chế độ đọc linh hoạt**:
  - **📜 Cuộn dọc (Webtoon style)**: Tải toàn bộ ảnh theo chiều dọc, hỗ trợ lazy-load.
  - **📄 Theo từng trang (Manga style)**: Hiển thị 1 ảnh giữa màn hình, có nút Trang trước / Trang sau, hỗ trợ phím mũi tên bàn phím (`←` / `→`).
- **Thanh điều hướng chương hoàn chỉnh**:
  - Nút **⇦ Chương trước** (tự ẩn nếu đang ở chương đầu).
  - Nút **Chương sau ⇨** (tự ẩn nếu đang ở chương cuối).
  - Nút quay lại trang thông tin chi tiết của bộ truyện.
- Hiển thị tên truyện, số chương, tổng số trang trên header cố định.

### 6.5. Tìm kiếm & Lọc nâng cao (`/search`)
- Tìm kiếm đồng thời theo: Tên truyện, Tên tác giả, Tag/Thể loại (từ khóa tự do), Trạng thái.
- Trả về kết quả dưới dạng lưới thẻ truyện trực quan.

### 6.6. Tag Input thông minh
- Cho phép nhập bất kỳ từ khóa tag nào, nhấn `Enter` hoặc dấu `,` để tạo tag dạng chip/badge.
- Hỗ trợ xóa tag bằng nút `×` hoặc phím `Backspace`.

### 6.7. Đóng gói & Chuẩn bị Git
- Tạo `.gitignore` chuẩn bảo vệ mã nguồn, loại bỏ `node_modules`, `__pycache__`, `cover-images/`, file `.env`.
- Cung cấp `.env.example` để dễ dàng clone và triển khai.
- Cấu hình ảnh giữ chỗ mặc định `rem.jpg`.

---

## 7. HƯỚNG DẪN VẬN HÀNH NHANH

### Khởi chạy Backend (Port 8000)
```powershell
cd D:\AI_My_Project\HManga-library\backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Khởi chạy Frontend (Port 3000)
```powershell
cd D:\AI_My_Project\HManga-library\frontend
npm install
npm run dev
```

Truy cập: **`http://localhost:3000`**