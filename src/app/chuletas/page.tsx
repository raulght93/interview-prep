'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Layers } from 'lucide-react';
import { CHEATSHEETS } from '@/data/cheatsheets';
import { getTopic } from '@/lib/data';

export default function ChuletasPage() {
  // All open by default for last-minute scanning; allow collapsing.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Inicio
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Chuletas · repaso rápido</span>
        <span className="w-12" aria-hidden />
      </div>
      <h1 className="mb-2 hidden text-2xl font-semibold text-zinc-900 print:block">Chuletas — repaso rápido</h1>

      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400 print:hidden">
        Los puntos clave de cada bloque en una pantalla, para el repaso de última hora. Imprimible con Cmd/Ctrl+P.
      </p>

      <div className="space-y-3">
        {CHEATSHEETS.map((cs) => {
          const topic = getTopic(cs.topicId);
          const isCollapsed = collapsed.has(cs.topicId);
          return (
            <section key={cs.topicId} className="rounded-2xl border border-zinc-200 bg-white dark:border-ink-700 dark:bg-ink-900">
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggle(cs.topicId)}
                  aria-expanded={!isCollapsed}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <span className="text-xl" aria-hidden>{topic?.emoji}</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{topic?.name}</span>
                  <ChevronDown
                    size={16}
                    className={`ml-auto text-zinc-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                    aria-hidden
                  />
                </button>
                <Link
                  href={`/flashcards/${cs.topicId}/`}
                  className="flex items-center gap-1 rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-500 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-400"
                  aria-label={`Flashcards de ${topic?.name}`}
                >
                  <Layers size={12} aria-hidden /> cards
                </Link>
              </div>
              <ul className={`space-y-1.5 px-4 pb-4 ${isCollapsed ? 'hidden print:block' : ''}`}>
                {cs.points.map((p, i) => (
                  <li key={`${cs.topicId}-${i}`} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
