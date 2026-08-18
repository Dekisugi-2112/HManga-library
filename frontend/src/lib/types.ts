// Kiểu dữ liệu cho bộ truyện
export interface Comic {
  id: number;
  title: string;
  author: string | null;
  type: 'multi' | 'oneshot';
  status: 'ongoing' | 'completed';
  cover_filename: string | null;
  personal_note: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

// Chi tiết truyện (kèm tags + chapters)
export interface ComicDetail extends Comic {
  tags: string[];
  chapters: Chapter[];
}

// Kiểu dữ liệu cho chương truyện
export interface Chapter {
  id: number;
  comic_id: number;
  chapter_number: number;
  title: string | null;
  base_url: string;
  total_pages: number;
  created_at: string;
  updated_at: string;
}

// Dữ liệu tạo truyện mới
export interface ComicCreate {
  title: string;
  author?: string;
  type: 'multi' | 'oneshot';
  status: 'ongoing' | 'completed';
  tags: string[];
  source_url?: string;
  personal_note?: string;
}

// Dữ liệu tạo chapter
export interface ChapterCreate {
  chapter_number: number;
  title?: string;
  base_url: string;
  total_pages: number;
}
