'use client';

import { useState } from 'react';
import ComicCard from '@/components/ComicCard';
import { searchComics } from '@/lib/api';
import { Comic } from '@/lib/types';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<Comic[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchComics({
        q: q || undefined,
        tag: tag || undefined,
        author: author || undefined,
        status: status || undefined,
      });
      setResults(data);
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">🔍 Tìm kiếm truyện</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tên truyện</label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nhập tên truyện..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tác giả</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nhập tên tác giả..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tag / Thể loại</label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Nhập tag..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
            >
              <option value="">Tất cả</option>
              <option value="ongoing">Đang tiến hành</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Đang tìm...' : '🔍 Tìm kiếm'}
        </button>
      </form>

      {/* Results */}
      {searched && (
        <div>
          <p className="text-sm text-slate-500 mb-4">
            Tìm thấy {results.length} kết quả
          </p>
          {results.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Không tìm thấy truyện nào phù hợp
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((comic) => (
                <ComicCard key={comic.id} comic={comic} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
