'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, RotateCcw, Trophy, X } from 'lucide-react';
import { MCQ, type McqQuestion } from '@/data/mcq';
import { topics, getTopic } from '@/lib/data';
import { shuffle } from '@/lib/srs';
import Markdown from '@/components/Markdown';
import ProgressBar from '@/components/ProgressBar';

type Phase = 'config' | 'running' | 'done';

interface Result {
  q: McqQuestion;
  picked: number;
  correct: boolean;
}

export default function TestPage() {
  const [phase, setPhase] = useState<Phase>('config');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [count, setCount] = useState<number>(10);
  const [deck, setDeck] = useState<McqQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  // Topics that actually have MCQ questions, plus an "all" option.
  const topicsWithMcq = useMemo(() => {
    const ids = new Set(MCQ.map((m) => m.topicId));
    return topics.filter((t) => ids.has(t.id));
  }, []);

  const filteredCount = useMemo(
    () => (topicFilter === 'all' ? MCQ.length : MCQ.filter((m) => m.topicId === topicFilter).length),
    [topicFilter],
  );

  function start() {
    const pool = topicFilter === 'all' ? MCQ : MCQ.filter((m) => m.topicId === topicFilter);
    const shuffled = shuffle(pool);
    const n = Math.min(count, shuffled.length);
    setDeck(shuffled.slice(0, n));
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setResults([]);
    setPhase('running');
  }

  function submit() {
    if (picked === null) return;
    setRevealed(true);
  }

  function next() {
    const q = deck[idx];
    const correct = picked === q.correctIndex;
    const newResults = [...results, { q, picked: picked!, correct }];
    setResults(newResults);

    if (idx + 1 >= deck.length) {
      setPhase('done');
    } else {
      setIdx(idx + 1);
      setPicked(null);
      setRevealed(false);
    }
  }

  function restart() {
    setPhase('config');
    setResults([]);
    setIdx(0);
    setPicked(null);
    setRevealed(false);
  }

  return (
    <main className="mx-auto max-w-card px-4 py-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Inicio
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Test · selección múltiple</span>
        <span className="w-12" aria-hidden />
      </div>

      {phase === 'config' && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900 sm:p-8">
          <h1 className="text-xl font-medium text-zinc-900 dark:text-white">Test rápido</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Preguntas con 4 opciones, una correcta. Tras responder, ves la explicación del porqué.
          </p>

          <div className="mt-6">
            <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Tema
            </label>
            <select
              id="topic"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-accent dark:border-ink-600 dark:bg-ink-800 dark:text-zinc-100"
            >
              <option value="all">Todos ({MCQ.length} preguntas)</option>
              {topicsWithMcq.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.name} ({MCQ.filter((m) => m.topicId === t.id).length})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">¿Cuántas preguntas?</label>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 20].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  disabled={n > filteredCount}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    count === n
                      ? 'border-accent bg-accent text-white'
                      : 'border-zinc-300 text-zinc-600 hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-300'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCount(filteredCount)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  count === filteredCount
                    ? 'border-accent bg-accent text-white'
                    : 'border-zinc-300 text-zinc-600 hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-300'
                }`}
              >
                Todas ({filteredCount})
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={start}
            disabled={filteredCount === 0}
            className="mt-6 w-full rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            Empezar test
          </button>
        </div>
      )}

      {phase === 'running' && deck[idx] && (
        <Player
          q={deck[idx]}
          idx={idx}
          total={deck.length}
          picked={picked}
          revealed={revealed}
          onPick={setPicked}
          onSubmit={submit}
          onNext={next}
          correctSoFar={results.filter((r) => r.correct).length}
        />
      )}

      {phase === 'done' && <Summary results={results} onRestart={restart} />}
    </main>
  );
}

function Player({
  q,
  idx,
  total,
  picked,
  revealed,
  onPick,
  onSubmit,
  onNext,
  correctSoFar,
}: {
  q: McqQuestion;
  idx: number;
  total: number;
  picked: number | null;
  revealed: boolean;
  onPick: (i: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  correctSoFar: number;
}) {
  const topic = getTopic(q.topicId);
  return (
    <div>
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <span>{topic?.emoji} {topic?.name}</span>
          <span>{idx + 1} de {total} · {correctSoFar} aciertos</span>
        </div>
        <ProgressBar value={idx} max={total} label="Progreso del test" />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900 sm:p-6">
        <h2 className="text-lg font-medium leading-snug text-zinc-900 dark:text-white">{q.question}</h2>

        <ul className="mt-4 space-y-2">
          {q.options.map((opt, i) => {
            const isPicked = picked === i;
            const isCorrect = i === q.correctIndex;
            let bg = 'border-zinc-200 bg-white hover:border-accent dark:border-ink-700 dark:bg-ink-800';
            if (revealed) {
              if (isCorrect) bg = 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30';
              else if (isPicked) bg = 'border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/30';
              else bg = 'border-zinc-200 bg-white opacity-60 dark:border-ink-700 dark:bg-ink-800';
            } else if (isPicked) {
              bg = 'border-accent bg-accent/10 dark:bg-accent/20';
            }
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => !revealed && onPick(i)}
                  disabled={revealed}
                  className={`flex min-h-[48px] w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${bg}`}
                  aria-pressed={isPicked}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    revealed && isCorrect ? 'bg-emerald-500 text-white'
                    : revealed && isPicked ? 'bg-rose-500 text-white'
                    : isPicked ? 'bg-accent text-white'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-ink-700 dark:text-zinc-300'
                  }`}>
                    {revealed && isCorrect ? <Check size={14} aria-hidden /> : revealed && isPicked ? <X size={14} aria-hidden /> : String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-zinc-800 dark:text-zinc-100">{opt}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {revealed && (
          <div className="mt-5 animate-fade-scale rounded-xl border border-accent/30 bg-accent/5 p-4 dark:border-accent/40 dark:bg-accent/10">
            <p className="mb-1 text-[0.7rem] font-medium uppercase tracking-wide text-accent">Explicación</p>
            <Markdown>{q.explanation}</Markdown>
          </div>
        )}

        <div className="mt-5">
          {!revealed ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={picked === null}
              className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            >
              Responder
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90"
            >
              {idx + 1 === total ? 'Ver resultados' : 'Siguiente'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Summary({ results, onRestart }: { results: Result[]; onRestart: () => void }) {
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
            Falladas ({failed.length}) — repásalas:
          </h2>
          <ul className="space-y-3">
            {failed.map(({ q, picked }) => {
              const topic = getTopic(q.topicId);
              return (
                <li key={q.id} className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-sm dark:border-rose-900/40 dark:bg-rose-950/20">
                  <p className="text-[0.7rem] font-medium uppercase tracking-wide text-rose-600 dark:text-rose-400">
                    {topic?.emoji} {topic?.name}
                  </p>
                  <p className="mt-1 font-medium text-zinc-900 dark:text-white">{q.question}</p>
                  <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                    Marcaste: <span className="text-rose-600 dark:text-rose-400">{q.options[picked]}</span>
                  </p>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                    Correcta: <span className="text-emerald-600 dark:text-emerald-400">{q.options[q.correctIndex]}</span>
                  </p>
                  <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Markdown>{q.explanation}</Markdown>
                  </div>
                </li>
              );
            })}
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
