'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, PartyPopper, RotateCcw, SkipForward } from 'lucide-react';
import { questions, getTopic, riskRank } from '@/lib/data';
import { shuffle } from '@/lib/srs';
import { getCard } from '@/lib/storage';
import { useProgress } from '@/lib/useProgress';
import { useKeyboard } from '@/lib/useKeyboard';
import type { CardStatus, Question } from '@/lib/types';
import Flashcard from '@/components/Flashcard';
import ProgressBar from '@/components/ProgressBar';

const SESSION_SIZE = 20; // ~20 min de repaso

export default function MixPage() {
  const { progress, hydrated, mark, touch } = useProgress();

  const [deck, setDeck] = useState<Question[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const seed = useCallback(() => {
    // Bucket by status; within "new"/"review" sort by topic risk (high first), then shuffle.
    const withMeta = questions.map((q) => ({ q, status: getCard(progress, q.id).status }));
    const byRisk = (a: { q: Question }, b: { q: Question }) =>
      riskRank(getTopic(b.q.topicId)?.risk) - riskRank(getTopic(a.q.topicId)?.risk);

    const fresh = shuffle(withMeta.filter((m) => m.status === 'new')).sort(byRisk);
    const review = shuffle(withMeta.filter((m) => m.status === 'review')).sort(byRisk);
    const known = shuffle(withMeta.filter((m) => m.status === 'known'));

    const ordered = [...review, ...fresh, ...known].map((m) => m.q);
    setDeck(ordered.slice(0, SESSION_SIZE));
    setIdx(0);
    setFlipped(false);
  }, [progress]);

  useEffect(() => {
    if (!hydrated || seeded) return;
    seed();
    setSeeded(true);
  }, [hydrated, seeded, seed]);

  const current = deck[idx];
  const topic = current ? getTopic(current.topicId) : undefined;
  const status: CardStatus = current ? getCard(progress, current.id).status : 'new';

  const reveal = useCallback(() => {
    setFlipped((f) => {
      if (!f && current) touch(current.id);
      return !f;
    });
  }, [current, touch]);

  const next = useCallback(() => {
    setFlipped(false);
    setIdx((i) => i + 1);
  }, []);

  const handleMark = useCallback(
    (s: CardStatus) => {
      if (!current) return;
      mark(current.id, s);
      next();
    },
    [current, mark, next],
  );

  useKeyboard(
    useMemo(
      () => ({
        ' ': (e: KeyboardEvent) => {
          e.preventDefault();
          reveal();
        },
        ArrowRight: next,
        k: () => handleMark('known'),
        r: () => handleMark('review'),
        s: () => handleMark('skipped'),
      }),
      [reveal, next, handleMark],
    ),
  );

  const done = seeded && idx >= deck.length;

  return (
    <main className="mx-auto max-w-card px-4 py-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Inicio
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Repaso diario</span>
        <span className="w-12" aria-hidden />
      </div>

      {!seeded ? (
        <p className="py-12 text-center text-sm text-zinc-400">Cargando…</p>
      ) : done ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
          <PartyPopper size={40} className="mx-auto mb-3 text-accent" aria-hidden />
          <h1 className="text-xl font-medium text-zinc-900 dark:text-white">Sesión completada</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Has repasado {deck.length} tarjeta{deck.length === 1 ? '' : 's'} de todos los temas.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => seed()}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90"
            >
              <RotateCcw size={16} aria-hidden /> Otra ronda
            </button>
            <Link href="/" className="rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200">
              Inicio
            </Link>
          </div>
        </div>
      ) : (
        current && (
          <div>
            <div className="mb-5">
              <div className="mb-1.5 flex justify-between text-xs text-zinc-400 dark:text-zinc-500">
                <span>
                  {topic?.emoji} {topic?.name}
                </span>
                <span>{idx + 1} de {deck.length}</span>
              </div>
              <ProgressBar value={idx} max={deck.length} label="Progreso de la sesión" />
            </div>

            <Flashcard question={current} flipped={flipped} status={status} onFlip={reveal} />

            <div className="mt-5 flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleMark('known')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-500"
                >
                  <Check size={18} aria-hidden /> La sabía <kbd className="hidden text-xs opacity-70 sm:inline">k</kbd>
                </button>
                <button
                  type="button"
                  onClick={() => handleMark('review')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-amber-950 transition hover:bg-amber-400"
                >
                  <RotateCcw size={18} aria-hidden /> Repasar <kbd className="hidden text-xs opacity-70 sm:inline">r</kbd>
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleMark('skipped')}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-300"
                  title="No la sé y no quiero repasarla"
                >
                  <SkipForward size={16} aria-hidden /> Saltar <kbd className="hidden text-xs opacity-70 sm:inline">s</kbd>
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-300"
                >
                  Siguiente <ArrowRight size={16} aria-hidden />
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </main>
  );
}
