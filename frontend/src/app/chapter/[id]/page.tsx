'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ChapterReader from '@/components/ChapterReader';
import { getChapterPages, getChapterWithContext } from '@/lib/api';

export default function ChapterReadPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = Number(params.id);

  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chapter context
  const [comicTitle, setComicTitle] = useState('');
  const [comicId, setComicId] = useState<number | null>(null);
  const [chapterNumber, setChapterNumber] = useState<number | undefined>();
  const [prevChapterId, setPrevChapterId] = useState<number | null>(null);
  const [nextChapterId, setNextChapterId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [chapterId]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [pagesData, context] = await Promise.all([
        getChapterPages(chapterId),
        getChapterWithContext(chapterId).catch(() => null),
      ]);
      setPages(pagesData);
      if (context) {
        setComicTitle(context.comic.title);
        setComicId(context.comic.id);
        setChapterNumber(context.chapter.chapter_number);
        setPrevChapterId(context.prevChapterId);
        setNextChapterId(context.nextChapterId);
      }
    } catch (err) {
      setError('Không thể tải trang ảnh: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Đang tải chương truyện...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">← Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-6">
      <ChapterReader
        pages={pages}
        comicTitle={comicTitle}
        chapterNumber={chapterNumber}
      />

      {/* Chapter Navigation */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          {/* Prev Chapter */}
          {prevChapterId ? (
            <button onClick={() => router.push(`/chapter/${prevChapterId}`)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg transition-colors">
              ⇦ Chương trước
            </button>
          ) : (
            <div />
          )}

          {/* Back to Comic */}
          <Link href={comicId ? `/comics/${comicId}` : '/'}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 text-sm rounded-lg transition-colors border border-slate-800">
            📚 {comicTitle || 'Trang chủ'}
          </Link>

          {/* Next Chapter */}
          {nextChapterId ? (
            <button onClick={() => router.push(`/chapter/${nextChapterId}`)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
              Chương sau ⇨
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
