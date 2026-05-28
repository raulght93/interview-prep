'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Layers } from 'lucide-react';
import { THEORY } from '@/data/theory';
import { getTopic } from '@/lib/data';
import Markdown from '@/components/Markdown';

export default function TeoriaPage() {
  // Default: first section open, rest collapsed (long content).
  const [open, setOpen] = useState<string>(THEORY[0]?.topicId ?? '');

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Inicio
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Teoría · conceptos clave</span>
        <span className="w-12" aria-hidden />
      </div>

      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
        Resúmenes teóricos por bloque para repasar los conceptos atando las ideas, en vez de en cards
        sueltas. Pliega/despliega cada sección.
      </p>

      <nav className="mb-6 flex flex-wrap gap-1.5" aria-label="Índice de teoría">
        {THEORY.map((t) => {
          const topic = getTopic(t.topicId);
          const isOpen = open === t.topicId;
          return (
            <button
              key={t.topicId}
              type="button"
              onClick={() => setOpen(t.topicId)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                isOpen
                  ? 'border-accent bg-accent text-white'
                  : 'border-zinc-300 text-zinc-600 hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-300'
              }`}
            >
              {topic?.emoji} {topic?.name.replace(/ \/.*$/, '')}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3">
        {THEORY.map((t) => {
          const topic = getTopic(t.topicId);
          const isOpen = open === t.topicId;
          return (
            <section
              key={t.topicId}
              id={`teoria-${t.topicId}`}
              className="rounded-2xl border border-zinc-200 bg-white dark:border-ink-700 dark:bg-ink-900"
            >
              <div className="flex items-center justify-between gap-2 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? '' : t.topicId)}
                  aria-expanded={isOpen}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <span className="text-xl" aria-hidden>{topic?.emoji}</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{topic?.name}</span>
                  <ChevronDown
                    size={16}
                    className={`ml-auto text-zinc-400 transition-transform ${isOpen ? '' : '-rotate-90'}`}
                    aria-hidden
                  />
                </button>
                <Link
                  href={`/flashcards/${t.topicId}/`}
                  className="flex items-center gap-1 rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-500 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-400"
                  aria-label={`Flashcards de ${topic?.name}`}
                >
                  <Layers size={12} aria-hidden /> cards
                </Link>
              </div>
              {isOpen && (
                <div className="border-t border-zinc-100 px-5 py-4 dark:border-ink-800">
                  <Markdown>{t.body}</Markdown>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
