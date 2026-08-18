'use client';

import { useState, useEffect } from 'react';
import ComicCard from '@/components/ComicCard';
import { getComics } from '@/lib/api';
import { Comic } from '@/lib/types';

export default function HomePage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadComics();
  }, [statusFilter]);

  async function loadComics() {
    setLoading(true);
    try {
      const data = await getComics({
        status: statusFilter || undefined,
        q: search || undefined,
      });
      setComics(data);
    } catch (err) {
      console.error('Lỗi tải danh sách truyện:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadComics();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Thư viện truyện</h1>
        <p className="text-sm text-slate-500 mt-1">
          {comics.length} bộ truyện
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm truyện..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 outline-none"
          />
        </form>

        <div className="flex gap-2">
          {['', 'ongoing', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {status === '' ? 'Tất cả' : status === 'ongoing' ? 'Đang tiến hành' : 'Hoàn thành'}
            </button>
          ))}
        </div>
      </div>

      {/* Comic Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500">Đang tải...</div>
      ) : comics.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500 text-lg">Chưa có truyện nào</p>
          <p className="text-slate-600 text-sm mt-2">
            Bấm &quot;+ Thêm truyện&quot; để bắt đầu
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {comics.map((comic) => (
            <ComicCard key={comic.id} comic={comic} />
          ))}
        </div>
      )}
    </div>
  );
}
