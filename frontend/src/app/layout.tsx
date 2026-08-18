import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "HManga Library",
  description: "Thư viện truyện tranh cá nhân",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              📚 HManga
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Trang chủ
              </Link>
              <Link
                href="/comics/add"
                className="text-sm px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                + Thêm truyện
              </Link>
              <Link
                href="/search"
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                🔍 Tìm kiếm
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
