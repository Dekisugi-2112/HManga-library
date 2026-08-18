'use client';

import { useState } from 'react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ value, onChange }: TagInputProps) {
  const [input, setInput] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = input.trim().toLowerCase();
      if (tag && !value.includes(tag)) {
        onChange([...value, tag]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeTag(tagToRemove: string) {
    onChange(value.filter((t) => t !== tagToRemove));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-2 focus-within:border-indigo-500 transition-colors min-h-[42px]">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-indigo-400/60 hover:text-red-400 transition-colors"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? 'Nhập tag rồi Enter...' : ''}
        className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-600"
      />
    </div>
  );
}
