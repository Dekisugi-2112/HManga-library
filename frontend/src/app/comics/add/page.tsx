'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UrlChecker from '@/components/UrlChecker';
import TagInput from '@/components/TagInput';
import { createComic, createChapter, downloadCover, checkComicByGalleryId } from '@/lib/api';
import { ComicDetail } from '@/lib/types';

export default function AddComicPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Comic metadata
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [type, setType] = useState<'multi' | 'oneshot'>('multi');
  const [status, setStatus] = useState<'ongoing' | 'completed'>('ongoing');
  const [tags, setTags] = useState<string[]>([]);
  const [personalNote, setPersonalNote] = useState('');

  // Chapter data (from UrlChecker)
  const [baseUrl, setBaseUrl] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [galleryId, setGalleryId] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [urlConfirmed, setUrlConfirmed] = useState(false);

  // Kiểm tra truyện đã tồn tại
  const [existingComic, setExistingComic] = useState<ComicDetail | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleUrlResult(data: { baseUrl: string; totalPages: number; galleryId: string }) {
    setBaseUrl(data.baseUrl);
    setTotalPages(data.totalPages);
    setGalleryId(data.galleryId);
    setUrlConfirmed(true);
    setExistingComic(null);

    if (type === 'oneshot') {
      setChapterTitle('oneshot');
    }

    // Kiểm tra gallery_id đã có trong DB chưa
    if (data.galleryId) {
      setChecking(true);
      try {
        const result = await checkComicByGalleryId(data.galleryId);
        if (result.exists && result.comic) {
          setExistingComic(result.comic);
        }
      } catch {
        // Ignore check errors
      } finally {
        setChecking(false);
      }
    }
  }

  // Thêm chapter cho truyện đã tồn tại
  async function handleAddToExisting() {
    if (!existingComic || !baseUrl) return;
    setSaving(true);
    setError('');
    try {
      await createChapter(existingComic.id, {
        chapter_number: chapterNumber,
        title: chapterTitle.trim() || undefined,
        base_url: baseUrl,
        total_pages: totalPages,
      });
      router.push(`/comics/${existingComic.id}`);
    } catch (err) {
      setError('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setSaving(false);
    }
  }

  // Tạo truyện mới
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Vui lòng nhập tên truyện'); return; }
    if (!urlConfirmed || !baseUrl) { setError('Vui lòng phân tích URL ảnh trước'); return; }

    setSaving(true);
    setError('');
    try {
      const comic = await createComic({
        title: title.trim(),
        author: author.trim() || undefined,
        type,
        status,
        tags,
        source_url: baseUrl,
        personal_note: personalNote.trim() || undefined,
      });
      await createChapter(comic.id, {
        chapter_number: chapterNumber,
        title: type === 'oneshot' ? 'oneshot' : chapterTitle.trim() || undefined,
        base_url: baseUrl,
        total_pages: totalPages,
      });
      try { await downloadCover(baseUrl, comic.id); } catch { /* ignore */ }
      router.push(`/comics/${comic.id}`);
    } catch (err) {
      setError('Lỗi khi lưu truyện: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Thêm truyện mới</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Checker */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">🔗 1. Kiểm tra URL ảnh</h2>
          <UrlChecker onResult={handleUrlResult} />
          {checking && (
            <div className="mt-3 px-3 py-2 bg-slate-800 rounded-lg text-sm text-slate-400">
              ⏳ Đang kiểm tra truyện đã tồn tại...
            </div>
          )}
          {urlConfirmed && !existingComic && (
            <div className="mt-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
              ✅ URL xác nhận — Gallery ID: <span className="font-mono">{galleryId}</span>, {totalPages} trang — Truyện mới
            </div>
          )}
        </div>

        {/* Truyện đã tồn tại */}
        {existingComic && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-amber-400">
              ⚠️ Truyện này đã có trong thư viện!
            </h2>
            <div className="flex gap-4 items-center">
              <div>
                <p className="text-slate-200 font-medium">{existingComic.title}</p>
                <p className="text-sm text-slate-500">
                  {existingComic.author || 'Không rõ tác giả'} • {existingComic.chapters?.length || 0} chương
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Số chương mới</label>
                <input type="number" value={chapterNumber}
                  onChange={(e) => setChapterNumber(parseFloat(e.target.value) || 1)}
                  min={0} step={0.5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tên chương</label>
                <input type="text" value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="Tùy chọn..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={handleAddToExisting} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                {saving ? '⏳ Đang lưu...' : '📖 Thêm chương vào bộ này'}
              </button>
              <Link href={`/comics/${existingComic.id}`}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
                Xem bộ truyện →
              </Link>
            </div>
          </div>
        )}

        {/* Comic Metadata — chỉ hiện khi truyện chưa tồn tại */}
        {!existingComic && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-semibold text-slate-200 mb-2">📝 2. Thông tin truyện</h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tên truyện *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tên truyện..." required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tác giả</label>
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Nhập tên tác giả..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Loại truyện</label>
                  <select value={type} onChange={(e) => {
                    const val = e.target.value as 'multi' | 'oneshot';
                    setType(val);
                    if (val === 'oneshot') setChapterTitle('oneshot');
                    else setChapterTitle('');
                  }} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none">
                    <option value="multi">Nhiều chapter</option>
                    <option value="oneshot">Oneshot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Trạng thái</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as 'ongoing' | 'completed')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none">
                    <option value="ongoing">Đang tiến hành</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Thể loại / Tag</label>
                <TagInput value={tags} onChange={setTags} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Ghi chú cá nhân</label>
                <textarea value={personalNote} onChange={(e) => setPersonalNote(e.target.value)}
                  placeholder="Ghi chú riêng..." rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none resize-none" />
              </div>
            </div>

            {/* Chapter Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-semibold text-slate-200 mb-2">📖 3. Thông tin chương</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Số chương</label>
                  <input type="number" value={chapterNumber}
                    onChange={(e) => setChapterNumber(parseFloat(e.target.value) || 1)}
                    min={0} step={0.5}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tên chương</label>
                  <input type="text" value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder={type === 'oneshot' ? 'oneshot' : 'Tùy chọn...'}
                    disabled={type === 'oneshot'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none disabled:opacity-50" />
                </div>
              </div>
              {urlConfirmed && (
                <div className="text-xs text-slate-500">
                  Base URL: <span className="font-mono text-slate-400">{baseUrl}</span>
                  <br />Tổng số trang: <span className="text-indigo-400">{totalPages}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={saving}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm">
              {saving ? '⏳ Đang lưu...' : '💾 Lưu truyện'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
