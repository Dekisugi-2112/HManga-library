'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getComic, deleteComic, deleteChapter, updateComic, updateChapter, createChapter, getCoverUrl } from '@/lib/api';
import TagInput from '@/components/TagInput';
import UrlChecker from '@/components/UrlChecker';
import { ComicDetail } from '@/lib/types';

export default function ComicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const comicId = Number(params.id);

  const [comic, setComic] = useState<ComicDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Comic Modal
  const [showEditComic, setShowEditComic] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editStatus, setEditStatus] = useState('ongoing');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNote, setEditNote] = useState('');

  // Edit Chapter Modal
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [editChapterNum, setEditChapterNum] = useState(1);
  const [editChapterTitle, setEditChapterTitle] = useState('');

  // Add Chapter Modal
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterNum, setNewChapterNum] = useState(1);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [newTotalPages, setNewTotalPages] = useState(0);
  const [newUrlConfirmed, setNewUrlConfirmed] = useState(false);

  useEffect(() => { loadComic(); }, [comicId]);

  async function loadComic() {
    try {
      const data = await getComic(comicId);
      setComic(data);
    } catch (err) { console.error('Lỗi:', err); }
    finally { setLoading(false); }
  }

  // === Edit Comic ===
  function openEditComic() {
    if (!comic) return;
    setEditTitle(comic.title);
    setEditAuthor(comic.author || '');
    setEditStatus(comic.status);
    setEditTags(comic.tags || []);
    setEditNote(comic.personal_note || '');
    setShowEditComic(true);
  }

  async function saveEditComic() {
    try {
      await updateComic(comicId, {
        title: editTitle,
        author: editAuthor || undefined,
        status: editStatus as 'ongoing' | 'completed',
        tags: editTags,
        personal_note: editNote || undefined,
      });
      setShowEditComic(false);
      loadComic();
    } catch (err) { alert('Lỗi: ' + (err instanceof Error ? err.message : '')); }
  }

  // === Edit Chapter ===
  function openEditChapter(chapterId: number) {
    const ch = comic?.chapters?.find(c => c.id === chapterId);
    if (!ch) return;
    setEditChapterNum(ch.chapter_number);
    setEditChapterTitle(ch.title || '');
    setEditingChapter(chapterId);
  }

  async function saveEditChapter() {
    if (!editingChapter) return;
    try {
      await updateChapter(editingChapter, {
        chapter_number: editChapterNum,
        title: editChapterTitle || undefined,
      });
      setEditingChapter(null);
      loadComic();
    } catch (err) { alert('Lỗi: ' + (err instanceof Error ? err.message : '')); }
  }

  // === Add Chapter ===
  function handleNewChapterUrl(data: { baseUrl: string; totalPages: number; galleryId: string }) {
    setNewBaseUrl(data.baseUrl);
    setNewTotalPages(data.totalPages);
    setNewUrlConfirmed(true);
  }

  async function saveNewChapter() {
    if (!newBaseUrl || !newTotalPages) return;
    try {
      await createChapter(comicId, {
        chapter_number: newChapterNum,
        title: newChapterTitle || undefined,
        base_url: newBaseUrl,
        total_pages: newTotalPages,
      });
      setShowAddChapter(false);
      setNewBaseUrl('');
      setNewTotalPages(0);
      setNewUrlConfirmed(false);
      loadComic();
    } catch (err) { alert('Lỗi: ' + (err instanceof Error ? err.message : '')); }
  }

  // === Delete ===
  async function handleDelete() {
    if (!confirm('Xóa bộ truyện này? Toàn bộ chapter sẽ bị xóa.')) return;
    await deleteComic(comicId);
    router.push('/');
  }

  async function handleDeleteChapter(chapterId: number) {
    if (!confirm('Xóa chapter này?')) return;
    await deleteChapter(chapterId);
    loadComic();
  }

  if (loading) return <div className="text-center py-20 text-slate-500">Đang tải...</div>;
  if (!comic) return <div className="text-center py-20 text-red-400">Không tìm thấy truyện</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex gap-6 mb-8">
        <div className="w-48 flex-shrink-0">
          <img src={getCoverUrl(comic.cover_filename)} alt={comic.title}
            referrerPolicy="no-referrer"
            className="w-full rounded-xl border border-slate-800 shadow-lg"
            onError={(e) => { (e.target as HTMLImageElement).src = '/rem.jpg'; }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">{comic.title}</h1>
          {comic.author && <p className="text-sm text-slate-400 mb-3">Tác giả: <span className="text-slate-300">{comic.author}</span></p>}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${comic.status === 'ongoing' ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-blue-500/15 text-blue-400 border border-blue-500/25'}`}>
              {comic.status === 'ongoing' ? 'Đang tiến hành' : 'Hoàn thành'}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
              {comic.type === 'oneshot' ? 'Oneshot' : 'Nhiều chương'}
            </span>
          </div>
          {comic.tags && comic.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {comic.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">{tag}</span>
              ))}
            </div>
          )}
          {comic.personal_note && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-sm text-slate-400 mb-4">📝 {comic.personal_note}</div>
          )}
          <div className="flex gap-2">
            <button onClick={openEditComic}
              className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm rounded-lg border border-indigo-500/20 transition-colors">
              ✏️ Sửa thông tin
            </button>
            <button onClick={handleDelete}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg border border-red-500/20 transition-colors">
              🗑 Xóa truyện
            </button>
          </div>
        </div>
      </div>

      {/* Chapter List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-200">Danh sách chương ({comic.chapters?.length || 0})</h2>
          <button onClick={() => setShowAddChapter(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
            + Thêm chương
          </button>
        </div>
        {!comic.chapters || comic.chapters.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">Chưa có chương nào</p>
        ) : (
          <div className="space-y-2">
            {[...comic.chapters].sort((a, b) => a.chapter_number - b.chapter_number).map((chapter) => (
              <div key={chapter.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 hover:border-slate-700 transition-colors">
                <Link href={`/chapter/${chapter.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-400 font-mono text-sm font-semibold">Ch.{chapter.chapter_number}</span>
                    {chapter.title && <span className="text-slate-300 text-sm truncate">{chapter.title}</span>}
                    <span className="text-slate-600 text-xs">{chapter.total_pages} trang</span>
                  </div>
                </Link>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => openEditChapter(chapter.id)}
                    className="text-slate-600 hover:text-indigo-400 text-xs transition-colors px-1">✏️</button>
                  <button onClick={() => handleDeleteChapter(chapter.id)}
                    className="text-slate-600 hover:text-red-400 text-xs transition-colors px-1">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === MODAL: Sửa thông tin truyện === */}
      {showEditComic && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowEditComic(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-100">Sửa thông tin truyện</h3>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Tên truyện</label>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Tác giả</label>
              <input type="text" value={editAuthor} onChange={e => setEditAuthor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Trạng thái</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none">
                <option value="ongoing">Đang tiến hành</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Tag</label>
              <TagInput value={editTags} onChange={setEditTags} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Ghi chú</label>
              <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none resize-none" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowEditComic(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-sm rounded-lg">Hủy</button>
              <button onClick={saveEditComic} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: Sửa chương === */}
      {editingChapter && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditingChapter(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-100">Sửa chương</h3>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Số chương</label>
              <input type="number" value={editChapterNum} onChange={e => setEditChapterNum(parseFloat(e.target.value) || 1)}
                min={0} step={0.5}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Tên chương</label>
              <input type="text" value={editChapterTitle} onChange={e => setEditChapterTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingChapter(null)} className="px-4 py-2 bg-slate-800 text-slate-300 text-sm rounded-lg">Hủy</button>
              <button onClick={saveEditChapter} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: Thêm chương mới === */}
      {showAddChapter && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowAddChapter(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-100">Thêm chương mới</h3>
            <UrlChecker onResult={handleNewChapterUrl} />
            {newUrlConfirmed && (
              <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
                ✅ URL xác nhận — {newTotalPages} trang
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Số chương</label>
                <input type="number" value={newChapterNum} onChange={e => setNewChapterNum(parseFloat(e.target.value) || 1)}
                  min={0} step={0.5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Tên chương</label>
                <input type="text" value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)} placeholder="Tùy chọn..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddChapter(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-sm rounded-lg">Hủy</button>
              <button onClick={saveNewChapter} disabled={!newUrlConfirmed}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg">Thêm chương</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
