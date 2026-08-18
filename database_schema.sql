-- =========================================================================
-- HManga-library Database Schema (Simplified: Multi-only, No Status)
-- Chạy script này trên Supabase SQL Editor
-- =========================================================================

-- 1. Bảng comics (ID tự tăng theo thứ tự thêm vào: 1, 2, 3...)
CREATE TABLE IF NOT EXISTS public.comics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    cover_filename VARCHAR(100),
    personal_note TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nếu database đã có bảng comics từ trước, gỡ 2 cột type và status:
ALTER TABLE public.comics DROP COLUMN IF EXISTS type;
ALTER TABLE public.comics DROP COLUMN IF EXISTS status;

-- 2. Bảng tags
CREATE TABLE IF NOT EXISTS public.tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 3. Bảng comic_tags (join table)
CREATE TABLE IF NOT EXISTS public.comic_tags (
    comic_id INT REFERENCES public.comics(id) ON DELETE CASCADE,
    tag_id INT REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (comic_id, tag_id)
);

-- 4. Bảng chapters
CREATE TABLE IF NOT EXISTS public.chapters (
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL REFERENCES public.comics(id) ON DELETE CASCADE,
    chapter_number NUMERIC(6,1) NOT NULL,
    title VARCHAR(255),
    base_url TEXT NOT NULL,
    total_pages INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (comic_id, chapter_number)
);

-- Indexes tối ưu tìm kiếm
CREATE INDEX IF NOT EXISTS idx_comics_title ON public.comics(title);
CREATE INDEX IF NOT EXISTS idx_chapters_comic_id ON public.chapters(comic_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON public.chapters(comic_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

-- Gỡ index cũ nếu có
DROP INDEX IF EXISTS idx_comics_status;
DROP INDEX IF EXISTS idx_comics_type;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_comics_modtime ON public.comics;
CREATE TRIGGER update_comics_modtime
    BEFORE UPDATE ON public.comics
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_chapters_modtime ON public.chapters;
CREATE TRIGGER update_chapters_modtime
    BEFORE UPDATE ON public.chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
