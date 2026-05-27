'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { Question } from '@/lib/types';
import Markdown from './Markdown';

export default function QuizQuestion({
  question,
  index,
  total,
  onAnswer,
}: {
  question: Question;
  index: number;
  total: number;
  onAnswer: (correct: boolean) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [note, setNote] = useState('');

  // Reset local state when the question changes (key prop also forces remount).
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-ink-700 dark:bg-ink-900 sm:p-8">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Pregunta {index + 1} de {total}
      </p>
      <h2 className="text-xl font-medium leading-snug text-zinc-900 dark:text-white sm:text-2xl">
        {question.question}
      </h2>

      {!revealed ? (
        <div className="mt-6">
          <label htmlFor="quiz-note" className="mb-2 block text-sm text-zinc-500 dark:text-zinc-400">
            Escribe tu respuesta (opcional — solo para ti) o respóndela en voz alta:
          </label>
          <textarea
            id="quiz-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-accent dark:border-ink-600 dark:bg-ink-800 dark:text-zinc-100"
            placeholder="Tu respuesta…"
          />
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-4 rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover:opacity-90"
          >
            Ver respuesta
          </button>
        </div>
      ) : (
        <div className="mt-6 animate-fade-scale">
          {note.trim() && (
            <div className="mb-4 rounded-lg bg-zinc-100 p-3 text-sm text-zinc-600 dark:bg-ink-800 dark:text-zinc-300">
              <span className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">Tu respuesta</span>
              {note}
            </div>
          )}
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-accent">Respuesta correcta</p>
          <Markdown>{question.answer}</Markdown>

          <p className="mb-2 mt-6 text-sm text-zinc-500 dark:text-zinc-400">¿Cómo te ha ido?</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onAnswer(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-500"
            >
              <Check size={18} aria-hidden /> Acerté
            </button>
            <button
              type="button"
              onClick={() => onAnswer(false)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 font-medium text-white transition hover:bg-rose-500"
            >
              <X size={18} aria-hidden /> Fallé
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
