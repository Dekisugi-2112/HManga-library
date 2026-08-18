'use client';

import { useState } from 'react';
import { parseHentaifoxUrl, generatePageUrls, extractGalleryId } from '@/lib/url-parser';

interface UrlCheckerProps {
  onResult: (data: { baseUrl: string; totalPages: number; galleryId: string }) => void;
}

export default function UrlChecker({ onResult }: UrlCheckerProps) {
  const [url, setUrl] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [parsedInfo, setParsedInfo] = useState<ReturnType<typeof parseHentaifoxUrl>>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<number, 'loading' | 'ok' | 'error'>>({});

  function handleAnalyze() {
    if (!url.trim()) return;
    const pages = parseInt(totalPages) || 1;
    const parsed = parseHentaifoxUrl(url.trim());
    setParsedInfo(parsed);
    if (parsed) {
      const urls = generatePageUrls(url.trim(), pages);
      setPreviewUrls(urls);
      setTestResults({});
    }
  }

  function handleTest() {
    // Test tải thử 3 ảnh đầu
    const testCount = Math.min(3, previewUrls.length);
    for (let i = 0; i < testCount; i++) {
      setTestResults((prev) => ({ ...prev, [i]: 'loading' }));
      const img = new Image();
      const idx = i;
      img.referrerPolicy = 'no-referrer';
      img.onload = () => setTestResults((prev) => ({ ...prev, [idx]: 'ok' }));
      img.onerror = () => setTestResults((prev) => ({ ...prev, [idx]: 'error' }));
      img.src = previewUrls[i];
    }
  }

  function handleConfirm() {
    const galleryId = extractGalleryId(url.trim()) || '';
    onResult({ baseUrl: url.trim(), totalPages: parseInt(totalPages) || 1, galleryId });
  }

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Dán URL ảnh từ hentaifox:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://i3.hentaifox.com/004/4029076/1t.jpg"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 outline-none"
          />
          <button
            type="button"
            onClick={handleAnalyze}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Phân tích
          </button>
        </div>
      </div>

      {/* Parsed Info */}
      {parsedInfo && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
          <p className="text-slate-400">
            <span className="text-slate-500">Gallery ID:</span>{' '}
            <span className="text-indigo-400 font-mono">{parsedInfo.galleryId}</span>
          </p>
          <p className="text-slate-400">
            <span className="text-slate-500">Hậu tố:</span>{' '}
            <span className="text-amber-400 font-mono">{parsedInfo.suffix || '(không có)'}</span>
          </p>
          <p className="text-slate-400">
            <span className="text-slate-500">Định dạng:</span>{' '}
            <span className="text-green-400 font-mono">.{parsedInfo.extension}</span>
          </p>
        </div>
      )}

      {/* Total Pages */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Tổng số trang:
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={totalPages}
            onChange={(e) => setTotalPages(e.target.value)}
            min={1}
            placeholder="Nhập số trang..."
            className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
          />
          <button
            type="button"
            onClick={handleAnalyze}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
          >
            Cập nhật danh sách
          </button>
        </div>
      </div>

      {/* Preview URL List */}
      {previewUrls.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-300">
              Danh sách URL ({previewUrls.length} trang):
            </label>
            <button
              type="button"
              onClick={handleTest}
              className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs font-medium rounded-md border border-green-500/30 transition-colors"
            >
              🧪 Test tải ảnh
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 max-h-40 overflow-y-auto space-y-0.5">
            {previewUrls.map((u, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-600 w-6 text-right">{i + 1}.</span>
                <span className="text-slate-400 truncate flex-1">{u}</span>
                {testResults[i] === 'loading' && (
                  <span className="text-yellow-400">⏳</span>
                )}
                {testResults[i] === 'ok' && (
                  <span className="text-green-400">✅</span>
                )}
                {testResults[i] === 'error' && (
                  <span className="text-red-400">❌</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {parsedInfo && previewUrls.length > 0 && (
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          ✓ Xác nhận sử dụng URL này
        </button>
      )}
    </div>
  );
}
