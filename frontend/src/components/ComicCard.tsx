'use client';

import Link from 'next/link';
import { Comic } from '@/lib/types';
import { getCoverUrl } from '@/lib/api';

interface ComicCardProps {
  comic: Comic;
  tags?: string[];
}

export default function ComicCard({ comic, tags = [] }: ComicCardProps) {
  return (
    <Link href={`/comics/${comic.id}`} className="group block">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all duration-200 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] bg-slate-800 overflow-hidden">
          <img
            src={getCoverUrl(comic.cover_filename)}
            alt={comic.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/rem.jpg';
            }}
          />
          {/* Status Badge */}
          <span
            className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-md ${
              comic.status === 'ongoing'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {comic.status === 'ongoing' ? 'Đang tiến hành' : 'Hoàn thành'}
          </span>
          {/* Type Badge */}
          {comic.type === 'oneshot' && (
            <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Oneshot
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-indigo-400 transition-colors">
            {comic.title}
          </h3>
          {comic.author && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{comic.author}</p>
          )}
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
