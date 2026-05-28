'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { searchQuestions, getTopic } from '@/lib/data';

export default function SearchBar() {
  const [term, setTerm] = useState('');
  const [closed, setClosed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchQuestions(term).slice(0, 30), [term]);
  const open = term.trim().length > 0 && !closed;

  // Reopen on every keystroke (term changes).
  useEffect(() => {
    if (term.trim().length > 0) setClosed(false);
  }, [term]);

  // Close on click outside.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setClosed(true);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setClosed(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar en preguntas, respuestas y tags…"
          aria-label="Buscar preguntas"
          className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-10 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-accent dark:border-ink-700 dark:bg-ink-900 dark:text-zinc-100"
        />
        {term && (
          <button
            type="button"
            onClick={() => setTerm('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-2 max-h-[60vh] w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-ink-700 dark:bg-ink-900">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">Sin resultados para “{term}”.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-ink-800">
              {results.map((q) => {
                const topic = getTopic(q.topicId);
                return (
                  <li key={q.id}>
                    <Link
                      href={`/flashcards/${q.topicId}/?card=${q.id}`}
                      onClick={() => setClosed(true)}
                      className="block px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-ink-800"
                    >
                      <p className="text-sm text-zinc-800 dark:text-zinc-100">{q.question}</p>
                      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                        {topic?.emoji} {topic?.name} · {q.tags.map((t) => `#${t}`).join(' ')}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
