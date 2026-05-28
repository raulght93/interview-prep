'use client';

import type { CardStatus, Question } from '@/lib/types';
import Markdown from './Markdown';

const statusLabel: Record<CardStatus, string> = {
  new: 'Nueva',
  known: 'La sabías',
  review: 'Para repasar',
  skipped: 'Saltada',
};

const statusStyle: Record<CardStatus, string> = {
  new: 'bg-zinc-200 text-zinc-700 dark:bg-ink-700 dark:text-zinc-300',
  known: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200',
  review: 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200',
  skipped: 'bg-zinc-300 text-zinc-600 line-through dark:bg-ink-600 dark:text-zinc-400',
};

const difficultyDot: Record<string, string> = {
  easy: 'bg-emerald-500',
  medium: 'bg-amber-500',
  hard: 'bg-rose-500',
};

export default function Flashcard({
  question,
  flipped,
  status,
  onFlip,
}: {
  question: Question;
  flipped: boolean;
  status: CardStatus;
  onFlip: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={flipped ? 'Mostrar la pregunta' : 'Mostrar la respuesta'}
      aria-pressed={flipped}
      className="group w-full cursor-pointer rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:border-accent/60 dark:border-ink-700 dark:bg-ink-900 sm:p-8"
    >
      {/* Header row: status + difficulty + tags */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[status]}`}>
          {statusLabel[status]}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className={`h-2 w-2 rounded-full ${difficultyDot[question.difficulty] ?? 'bg-zinc-400'}`} aria-hidden />
          {question.difficulty}
        </span>
        {question.tags.map((t) => (
          <span key={t} className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-ink-800 dark:text-zinc-400">
            #{t}
          </span>
        ))}
      </div>

      {/* Body: question always on top; answer revealed when flipped */}
      <div key={flipped ? 'back' : 'front'} className="animate-fade-scale">
        {!flipped ? (
          <div>
            <h2 className="text-xl font-medium leading-snug text-zinc-900 dark:text-white sm:text-2xl">
              {question.question}
            </h2>
            <p className="mt-6 text-sm text-zinc-400 dark:text-zinc-500">
              Pulsa la tarjeta o <kbd className="rounded border border-zinc-300 px-1 dark:border-ink-600">espacio</kbd> para ver la respuesta
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-wide text-accent">Respuesta</p>
            <Markdown>{question.answer}</Markdown>
          </div>
        )}
      </div>
    </button>
  );
}
