'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { getTopic, questionsByTopic } from '@/lib/data';
import { shuffle } from '@/lib/srs';
import { useProgress } from '@/lib/useProgress';
import type { Question } from '@/lib/types';
import QuizQuestion from './QuizQuestion';
import ProgressBar from './ProgressBar';

type Phase = 'config' | 'running' | 'done';

export default function QuizClient({ topicId }: { topicId: string }) {
  const topic = getTopic(topicId);
  const all = useMemo(() => questionsByTopic(topicId), [topicId]);
  const { mark } = useProgress();

  const [phase, setPhase] = useState<Phase>('config');
  const [deck, setDeck] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<{ q: Question; correct: boolean }[]>([]);

  function start(count: number | 'all') {
    const shuffled = shuffle(all);
    const n = count === 'all' ? shuffled.length : Math.min(count, shuffled.length);
    setDeck(shuffled.slice(0, n));
    setIdx(0);
    setResults([]);
    setPhase('running');
  }

  function answer(correct: boolean) {
    const q = deck[idx];
    mark(q.id, correct ? 'known' : 'review');
    const next = [...results, { q, correct }];
    setResults(next);
    if (idx + 1 >= deck.length) {
      setPhase('done');
    } else {
      setIdx(idx + 1);
    }
  }

  function restart() {
    setPhase('config');
    setDeck([]);
    setIdx(0);
    setResults([]);
  }

  if (!topic) {
    return (
      <main className="mx-auto max-w-card px-4 py-12 text-center">
        <p className="text-zinc-500">Tema no encontrado.</p>
        <Link href="/" className="mt-4 inline-block text-accent underline">Volver al inicio</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-card px-4 py-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Temas
        </Link>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <span aria-hidden>{topic.emoji}</span>
          <span className="font-medium">{topic.name}</span>
        </div>
        <span className="text-sm text-zinc-400">Quiz</span>
      </div>

      {phase === 'config' && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-ink-700 dark:bg-ink-900 sm:p-8">
          <h1 className="text-xl font-medium text-zinc-900 dark:text-white">Modo Quiz</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Responde mentalmente o por escrito, revela la respuesta y autoevalúate. {all.length} preguntas disponibles.
          </p>
          <p className="mt-6 mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">¿Cuántas preguntas?</p>
          <div className="flex justify-center gap-2">
            {([5, 10, 'all'] as const).map((c) => (
              <button
                key={String(c)}
                type="button"
                onClick={() => start(c)}
                disabled={c !== 'all' && all.length < (c as number)}
                className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {c === 'all' ? `Todas (${all.length})` : c}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'running' && deck[idx] && (
        <div>
          <div className="mb-5">
            <div className="mb-1.5 flex justify-between text-xs text-zinc-400 dark:text-zinc-500">
              <span>{idx + 1} de {deck.length}</span>
              <span>{results.filter((r) => r.correct).length} aciertos</span>
            </div>
            <ProgressBar value={idx} max={deck.length} label="Progreso del quiz" />
          </div>
          <QuizQuestion
            key={deck[idx].id}
            question={deck[idx]}
            index={idx}
            total={deck.length}
            onAnswer={answer}
          />
        </div>
      )}

      {phase === 'done' && <QuizSummary results={results} onRestart={restart} />}
    </main>
  );
}

function QuizSummary({
  results,
  onRestart,
}: {
  results: { q: Question; correct: boolean }[];
  onRestart: () => void;
}) {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const failed = results.filter((r) => !r.correct);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900 sm:p-8">
      <div className="text-center">
        <Trophy size={40} className="mx-auto mb-3 text-amber-500" aria-hidden />
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">{correct} / {total}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{pct}% de aciertos</p>
        <div className="mx-auto mt-4 max-w-xs">
          <ProgressBar value={correct} max={total} label="Resultado" />
        </div>
      </div>

      {failed.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Preguntas falladas ({failed.length}) — repásalas:
          </h2>
          <ul className="space-y-2">
            {failed.map(({ q }) => (
              <li key={q.id}>
                <Link
                  href={`/flashcards/${q.topicId}/?card=${q.id}`}
                  className="block rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-700 dark:text-zinc-200"
                >
                  {q.question}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90"
        >
          <RotateCcw size={16} aria-hidden /> Otra ronda
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
        >
          Inicio
        </Link>
      </div>
    </div>
  );
}
