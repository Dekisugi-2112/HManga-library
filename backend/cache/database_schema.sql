-- =========================================================================
-- HManga-library Database Schema (Simplified: No Timestamps, No Tags)
-- Chạy script này trên Supabase SQL Editor
-- =========================================================================

-- 1. Bảng comics (ID tự tăng theo thứ tự thêm vào: 1, 2, 3...)
CREATE TABLE IF NOT EXISTS public.comics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    cover_filename VARCHAR(100),
    source_url TEXT
);

-- Gỡ bỏ các cột không sử dụng (nếu bảng đã tồn tại từ trước)
ALTER TABLE public.comics DROP COLUMN IF EXISTS type;
ALTER TABLE public.comics DROP COLUMN IF EXISTS status;
ALTER TABLE public.comics DROP COLUMN IF EXISTS personal_note;
ALTER TABLE public.comics DROP COLUMN IF EXISTS created_at;
ALTER TABLE public.comics DROP COLUMN IF EXISTS updated_at;

-- 2. Xóa bỏ hoàn toàn hệ thống tags cũ (nếu có)
DROP TABLE IF EXISTS public.comic_tags CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP INDEX IF EXISTS idx_tags_name;

-- 3. Bảng thể loại (genres)
CREATE TABLE IF NOT EXISTS public.genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Gỡ bỏ timestamp khỏi bảng genres nếu có
ALTER TABLE public.genres DROP COLUMN IF EXISTS created_at;

-- 4. Bảng liên kết truyện & thể loại (comic_genres)
CREATE TABLE IF NOT EXISTS public.comic_genres (
    comic_id INT REFERENCES public.comics(id) ON DELETE CASCADE,
    genre_id INT REFERENCES public.genres(id) ON DELETE CASCADE,
    PRIMARY KEY (comic_id, genre_id)
);

-- 5. Bảng chapters
CREATE TABLE IF NOT EXISTS public.chapters (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL REFERENCES public.comics(id) ON DELETE CASCADE,
    chapter_number NUMERIC(6,1) NOT NULL,
    title VARCHAR(255),
    base_url TEXT NOT NULL,
    total_pages INT NOT NULL,
    UNIQUE (comic_id, chapter_number)
);

-- Gỡ bỏ timestamp khỏi bảng chapters nếu có
ALTER TABLE public.chapters DROP COLUMN IF EXISTS created_at;
ALTER TABLE public.chapters DROP COLUMN IF EXISTS updated_at;

-- Gỡ bỏ triggers tự động cập nhật timestamp (nếu có)
DROP TRIGGER IF EXISTS update_comics_modtime ON public.comics;
DROP TRIGGER IF EXISTS update_chapters_modtime ON public.chapters;
DROP FUNCTION IF EXISTS update_modified_column CASCADE;

-- Indexes tối ưu tìm kiếm
CREATE INDEX IF NOT EXISTS idx_comics_title ON public.comics(title);
CREATE INDEX IF NOT EXISTS idx_comics_author ON public.comics(author);
CREATE INDEX IF NOT EXISTS idx_chapters_comic_id ON public.chapters(comic_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON public.chapters(comic_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_genres_name ON public.genres(name);

-- Gỡ index cũ không dùng
DROP INDEX IF EXISTS idx_comics_status;
DROP INDEX IF EXISTS idx_comics_type;

-- Thêm các thể loại mẫu phổ biến nếu bảng chưa có
INSERT INTO public.genres (name) VALUES
    ('Action'),
    ('Adventure'),
    ('Comedy'),
    ('Drama'),
    ('Fantasy'),
    ('Harem'),
    ('Horror'),
    ('Mystery'),
    ('Romance'),
    ('School Life'),
    ('Sci-Fi'),
    ('Slice of Life'),
    ('Supernatural'),
    ('Ecchi'),
    ('Doujinshi'),
    ('Manga'),
    ('Manhwa'),
    ('Manhua')
ON CONFLICT (name) DO NOTHING;
