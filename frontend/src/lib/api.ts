import { Comic, ComicDetail, ComicCreate, Chapter, ChapterCreate } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ==================== Comics ====================

export async function getComics(params?: {
  status?: string;
  tag?: string;
  q?: string;
}): Promise<Comic[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.tag) searchParams.set('tag', params.tag);
  if (params?.q) searchParams.set('q', params.q);

  const query = searchParams.toString();
  const res = await fetch(`${API_BASE}/api/comics${query ? '?' + query : ''}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch comics');
  return res.json();
}

export async function getComic(id: number): Promise<ComicDetail> {
  const res = await fetch(`${API_BASE}/api/comics/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch comic');
  return res.json();
}

export async function createComic(data: ComicCreate): Promise<Comic> {
  const res = await fetch(`${API_BASE}/api/comics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create comic');
  return res.json();
}

export async function updateComic(id: number, data: Partial<ComicCreate>): Promise<Comic> {
  const res = await fetch(`${API_BASE}/api/comics/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update comic');
  return res.json();
}

export async function deleteComic(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/comics/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete comic');
}

// ==================== Chapters ====================

export async function getChapters(comicId: number): Promise<Chapter[]> {
  const res = await fetch(`${API_BASE}/api/comics/${comicId}/chapters`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch chapters');
  return res.json();
}

export async function createChapter(comicId: number, data: ChapterCreate): Promise<Chapter> {
  const res = await fetch(`${API_BASE}/api/comics/${comicId}/chapters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create chapter');
  return res.json();
}

export async function updateChapter(
  id: number,
  data: { title?: string; chapter_number?: number }
): Promise<Chapter> {
  const res = await fetch(`${API_BASE}/api/chapters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update chapter');
  return res.json();
}

export async function deleteChapter(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chapters/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete chapter');
}

export async function getChapterPages(id: number): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/chapters/${id}/pages`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch pages');
  return res.json();
}

// ==================== Images ====================

export async function downloadCover(url: string, comicId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/images/download-cover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, comic_id: comicId }),
  });
  if (!res.ok) throw new Error('Failed to download cover');
}

// ==================== Search ====================

export async function searchComics(params: {
  q?: string;
  tag?: string;
  status?: string;
  author?: string;
}): Promise<Comic[]> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set('q', params.q);
  if (params.tag) searchParams.set('tag', params.tag);
  if (params.status) searchParams.set('status', params.status);
  if (params.author) searchParams.set('author', params.author);

  const res = await fetch(`${API_BASE}/api/search?${searchParams.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to search');
  return res.json();
}

// ==================== Check Existing ====================

export async function checkComicByGalleryId(galleryId: string): Promise<{exists: boolean; comic?: ComicDetail}> {
  const res = await fetch(`${API_BASE}/api/comics/check/${galleryId}`, { cache: 'no-store' });
  if (!res.ok) return { exists: false };
  return res.json();
}

// ==================== Chapter Context ====================

export async function getChapterWithContext(chapterId: number): Promise<{
  chapter: Chapter;
  comic: ComicDetail;
  prevChapterId: number | null;
  nextChapterId: number | null;
}> {
  // Lấy thông tin chapter
  const chapterRes = await fetch(`${API_BASE}/api/chapters/${chapterId}/pages`, { cache: 'no-store' });
  
  // Tìm comic_id từ tất cả comics
  const allComics = await getComics();
  let targetComic: ComicDetail | null = null;
  
  for (const comic of allComics) {
    const detail = await getComic(comic.id);
    const found = detail.chapters?.find(ch => ch.id === chapterId);
    if (found) {
      targetComic = detail;
      break;
    }
  }
  
  if (!targetComic) throw new Error('Comic not found');
  
  const sortedChapters = [...(targetComic.chapters || [])].sort((a, b) => a.chapter_number - b.chapter_number);
  const currentIndex = sortedChapters.findIndex(ch => ch.id === chapterId);
  
  return {
    chapter: sortedChapters[currentIndex],
    comic: targetComic,
    prevChapterId: currentIndex > 0 ? sortedChapters[currentIndex - 1].id : null,
    nextChapterId: currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1].id : null,
  };
}

// ==================== Helper ====================

export function getCoverUrl(filename: string | null): string {
  if (!filename) return '/rem.jpg';
  return `${API_BASE}/api/covers/${filename}`;
}
