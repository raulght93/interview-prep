'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, PartyPopper, SkipForward } from 'lucide-react';
import { questions, getTopic } from '@/lib/data';
import { shuffle } from '@/lib/srs';
import { getCard } from '@/lib/storage';
import { useProgress } from '@/lib/useProgress';
import { useKeyboard } from '@/lib/useKeyboard';
import Flashcard from '@/components/Flashcard';
import ProgressBar from '@/components/ProgressBar';

export default function ReviewPage() {
  const { progress, hydrated, mark, touch } = useProgress();

  // The working deck: built once from cards marked 'review', shuffled.
  // Cards leave the deck as soon as they're marked 'known'.
  const [deck, setDeck] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cleared, setCleared] = useState(0);

  useEffect(() => {
    if (!hydrated || seeded) return;
    const ids = questions.filter((q) => getCard(progress, q.id).status === 'review').map((q) => q.id);
    setDeck(shuffle(ids));
    setSeeded(true);
  }, [hydrated, seeded, progress]);

  const currentId = deck[idx];
  const current = useMemo(() => questions.find((q) => q.id === currentId), [currentId]);
  const topic = current ? getTopic(current.topicId) : undefined;
  const remaining = deck.length - idx;

  function reveal() {
    setFlipped((f) => {
      if (!f && currentId) touch(currentId);
      return !f;
    });
  }

  function knewIt() {
    if (!currentId) return;
    mark(currentId, 'known'); // leaves the review set
    setCleared((c) => c + 1);
    setFlipped(false);
    setIdx((i) => i + 1);
  }

  function keepReviewing() {
    if (!currentId) return;
    touch(currentId);
    setFlipped(false);
    setIdx((i) => i + 1);
  }

  function skipIt() {
    if (!currentId) return;
    mark(currentId, 'skipped');
    setFlipped(false);
    setIdx((i) => i + 1);
  }

  useKeyboard(
    useMemo(
      () => ({
        ' ': (e) => {
          e.preventDefault();
          reveal();
        },
        k: knewIt,
        s: skipIt,
        ArrowRight: keepReviewing,
      }),
      [currentId],
    ),
  );

  const done = seeded && (deck.length === 0 || idx >= deck.length);

  return (
    <main className="mx-auto max-w-card px-4 py-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Temas
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Repaso · marcadas</span>
        <span className="w-12" aria-hidden />
      </div>

      {!seeded ? (
        <p className="py-12 text-center text-sm text-zinc-400">Cargando…</p>
      ) : done ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
          <PartyPopper size={40} className="mx-auto mb-3 text-emerald-500" aria-hidden />
          <h1 className="text-xl font-medium text-zinc-900 dark:text-white">
            {deck.length === 0 ? 'No hay nada que repasar' : '¡Repaso completado!'}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {deck.length === 0
              ? 'Marca preguntas como “Repasar” en el modo flashcard o quiz y aparecerán aquí.'
              : `Has revisado ${deck.length} tarjeta${deck.length === 1 ? '' : 's'} · ${cleared} marcada${cleared === 1 ? '' : 's'} como sabida.`}
          </p>
          <Link href="/" className="mt-6 inline-block rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90">
            Volver al inicio
          </Link>
        </div>
      ) : (
        current && (
          <div>
            <div className="mb-5">
              <div className="mb-1.5 flex justify-between text-xs text-zinc-400 dark:text-zinc-500">
                <span>
                  {topic?.emoji} {topic?.name}
                </span>
                <span>{remaining} restante{remaining === 1 ? '' : 's'}</span>
              </div>
              <ProgressBar value={idx} max={deck.length} label="Progreso del repaso" />
            </div>

            <Flashcard question={current} flipped={flipped} status="review" onFlip={reveal} />

            <div className="mt-5 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={knewIt}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-500"
                >
                  <Check size={18} aria-hidden /> La sabía <kbd className="hidden text-xs opacity-70 sm:inline">k</kbd>
                </button>
                <button
                  type="button"
                  onClick={keepReviewing}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
                >
                  Sigue en repaso →
                </button>
              </div>
              <button
                type="button"
                onClick={skipIt}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-500 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-400"
                title="No la quiero repasar más"
              >
                <SkipForward size={15} aria-hidden /> Saltar (sácala del repaso) <kbd className="hidden text-xs opacity-70 sm:inline">s</kbd>
              </button>
            </div>
          </div>
        )
      )}
    </main>
  );
}
