'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Shuffle, SkipForward } from 'lucide-react';
import type { CardStatus } from '@/lib/types';
import { getTopic, questionsByTopic } from '@/lib/data';
import { srsSort, shuffle } from '@/lib/srs';
import { useProgress } from '@/lib/useProgress';
import { getCard } from '@/lib/storage';
import { useKeyboard } from '@/lib/useKeyboard';
import Flashcard from './Flashcard';
import ProgressBar from './ProgressBar';

export default function FlashcardClient({ topicId }: { topicId: string }) {
  const topic = getTopic(topicId);
  const base = useMemo(() => questionsByTopic(topicId), [topicId]);
  const { progress, hydrated, mark, touch } = useProgress();

  const [order, setOrder] = useState(base);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Seed the deck order once, after progress hydrates, using SRS sort.
  // Also honour a ?card=<id> deep link from search.
  useEffect(() => {
    if (!hydrated || seeded) return;
    const sorted = srsSort(base, progress);
    setOrder(sorted);

    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('card');
    if (cardId) {
      const pos = sorted.findIndex((q) => q.id === cardId);
      if (pos >= 0) setIdx(pos);
    }
    setSeeded(true);
  }, [hydrated, seeded, base, progress]);

  const current = order[idx];

  const goNext = useCallback(() => {
    setFlipped(false);
    setIdx((i) => Math.min(order.length - 1, i + 1));
  }, [order.length]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setIdx((i) => Math.max(0, i - 1));
  }, []);

  const doFlip = useCallback(() => {
    setFlipped((f) => {
      if (!f && current) touch(current.id); // count a view on first reveal
      return !f;
    });
  }, [current, touch]);

  const handleMark = useCallback(
    (status: CardStatus) => {
      if (!current) return;
      mark(current.id, status);
      goNext();
    },
    [current, mark, goNext],
  );

  function toggleShuffle() {
    const next = !shuffleOn;
    setShuffleOn(next);
    setIdx(0);
    setFlipped(false);
    setOrder(next ? shuffle(base) : srsSort(base, progress));
  }

  useKeyboard(
    useMemo(
      () => ({
        ' ': (e) => {
          e.preventDefault();
          doFlip();
        },
        ArrowRight: goNext,
        ArrowLeft: goPrev,
        k: () => handleMark('known'),
        r: () => handleMark('review'),
        s: () => handleMark('skipped'),
      }),
      [doFlip, goNext, goPrev, handleMark],
    ),
  );

  if (!topic) {
    return (
      <main className="mx-auto max-w-card px-4 py-12 text-center">
        <p className="text-zinc-500">Tema no encontrado.</p>
        <Link href="/" className="mt-4 inline-block text-accent underline">Volver al inicio</Link>
      </main>
    );
  }

  if (order.length === 0) {
    return (
      <main className="mx-auto max-w-card px-4 py-12 text-center">
        <p className="text-zinc-500">Este tema aún no tiene preguntas.</p>
        <Link href="/" className="mt-4 inline-block text-accent underline">Volver al inicio</Link>
      </main>
    );
  }

  const status: CardStatus = current ? getCard(progress, current.id).status : 'new';

  return (
    <main className="mx-auto max-w-card px-4 py-6 sm:py-8">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400"
        >
          <ArrowLeft size={16} aria-hidden /> Temas
        </Link>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <span aria-hidden>{topic.emoji}</span>
          <span className="font-medium">{topic.name}</span>
        </div>
        <button
          type="button"
          onClick={toggleShuffle}
          aria-pressed={shuffleOn}
          aria-label="Mezclar el orden de las tarjetas"
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition ${
            shuffleOn
              ? 'border-accent text-accent'
              : 'border-zinc-300 text-zinc-500 hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-400'
          }`}
        >
          <Shuffle size={14} aria-hidden /> {shuffleOn ? 'Mezclado' : 'Mezclar'}
        </button>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="mb-1.5 flex justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <span>{idx + 1} de {order.length}</span>
          <span>{Math.round(((idx + 1) / order.length) * 100)}%</span>
        </div>
        <ProgressBar value={idx + 1} max={order.length} label="Progreso del tema" />
      </div>

      {current && <Flashcard question={current} flipped={flipped} status={status} onFlip={doFlip} />}

      {/* Controls */}
      <div className="mt-5 flex flex-col gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleMark('known')}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-500"
          >
            <Check size={18} aria-hidden /> La sabía <kbd className="hidden text-xs opacity-70 sm:inline">k</kbd>
          </button>
          <button
            type="button"
            onClick={() => handleMark('review')}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-amber-950 transition hover:bg-amber-400"
          >
            <RotateCcw size={18} aria-hidden /> Repasar <kbd className="hidden text-xs opacity-70 sm:inline">r</kbd>
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={idx === 0}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 transition hover:border-accent hover:text-accent disabled:opacity-40 dark:border-ink-600 dark:text-zinc-300"
          >
            <ArrowLeft size={16} aria-hidden /> Anterior
          </button>
          <button
            type="button"
            onClick={() => handleMark('skipped')}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-300"
            title="No la sé y no quiero repasarla — sácala del repaso"
          >
            <SkipForward size={16} aria-hidden /> Saltar <kbd className="hidden text-xs opacity-70 sm:inline">s</kbd>
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={idx === order.length - 1}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 transition hover:border-accent hover:text-accent disabled:opacity-40 dark:border-ink-600 dark:text-zinc-300"
          >
            Siguiente <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      </div>
    </main>
  );
}
