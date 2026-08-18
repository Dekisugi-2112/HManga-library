'use client';

import { useState, useCallback, useEffect } from 'react';

interface ChapterReaderProps {
  pages: string[];
  comicTitle?: string;
  chapterNumber?: number;
}

export default function ChapterReader({ pages, comicTitle, chapterNumber }: ChapterReaderProps) {
  const [mode, setMode] = useState<'scroll' | 'page'>('scroll');
  const [currentPage, setCurrentPage] = useState(0);

  // Điều hướng bằng bàn phím (chế độ theo trang)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (mode !== 'page') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentPage((p) => Math.min(p + 1, pages.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentPage((p) => Math.max(p - 1, 0));
      }
    },
    [mode, pages.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div>
      {/* Header Controls */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-slate-400">
            {comicTitle && <span className="text-slate-300 font-medium">{comicTitle}</span>}
            {chapterNumber !== undefined && (
              <span className="ml-2 text-indigo-400">Chương {chapterNumber}</span>
            )}
            <span className="ml-2 text-slate-500">({pages.length} trang)</span>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
            <button
              onClick={() => setMode('scroll')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === 'scroll'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📜 Cuộn dọc
            </button>
            <button
              onClick={() => setMode('page')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === 'page'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📄 Theo trang
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Mode */}
      {mode === 'scroll' && (
        <div className="max-w-4xl mx-auto">
          {pages.map((pageUrl, i) => (
            <div key={i} className="relative">
              <img
                src={pageUrl}
                alt={`Trang ${i + 1}`}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-auto block"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.minHeight = '200px';
                  target.style.background = '#1e293b';
                  target.alt = `Lỗi tải trang ${i + 1}`;
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Page Mode */}
      {mode === 'page' && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Current Image */}
          <div className="relative min-h-[400px] flex items-center justify-center">
            <img
              src={pages[currentPage]}
              alt={`Trang ${currentPage + 1}`}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[85vh] h-auto mx-auto block"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.minHeight = '200px';
                target.style.background = '#1e293b';
              }}
            />
          </div>

          {/* Page Navigation */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 text-sm rounded-lg transition-colors"
            >
              ← Trang trước
            </button>
            <span className="text-sm text-slate-400 font-mono">
              {currentPage + 1} / {pages.length}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, pages.length - 1))}
              disabled={currentPage === pages.length - 1}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 text-sm rounded-lg transition-colors"
            >
              Trang sau →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
