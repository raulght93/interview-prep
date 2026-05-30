'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Flag, RotateCcw, SkipForward, Trophy, X } from 'lucide-react';
import { MCQ, type McqQuestion } from '@/data/mcq';
import { topics, getTopic } from '@/lib/data';
import { shuffle } from '@/lib/srs';
import Markdown from '@/components/Markdown';
import ProgressBar from '@/components/ProgressBar';
import {
  loadMcqFailed, saveMcqFailed,
  loadMcqSkipped, saveMcqSkipped,
} from '@/lib/storage';

type Phase = 'config' | 'running' | 'done';
type TestMode = 'all' | 'failed' | 'skipped';

interface Result {
  q: McqQuestion;
  picked: number | null; // null = skipped
  correct: boolean;
  skipped: boolean;
}

export default function TestPage() {
  const [phase, setPhase] = useState<Phase>('config');
  const [testMode, setTestMode] = useState<TestMode>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [count, setCount] = useState<number>(10);
  const [deck, setDeck] = useState<McqQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  // Persistent failed/skipped lists
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);

  useEffect(() => {
    setFailedIds(loadMcqFailed());
    setSkippedIds(loadMcqSkipped());
  }, []);

  const topicsWithMcq = useMemo(() => {
    const ids = new Set(MCQ.map((m) => m.topicId));
    return topics.filter((t) => ids.has(t.id));
  }, []);

  // Pool for the current mode+topic combination
  const pool = useMemo(() => {
    if (testMode === 'failed') return MCQ.filter((m) => failedIds.includes(m.id));
    if (testMode === 'skipped') return MCQ.filter((m) => skippedIds.includes(m.id));
    return topicFilter === 'all' ? MCQ : MCQ.filter((m) => m.topicId === topicFilter);
  }, [testMode, topicFilter, failedIds, skippedIds]);

  function buildDeck(overridePool?: McqQuestion[]) {
    const source = overridePool ?? pool;
    const shuffled = shuffle(source);
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

  function commitAnswer(pickedIdx: number | null, wasSkipped: boolean) {
    const q = deck[idx];
    const correct = !wasSkipped && pickedIdx === q.correctIndex;
    const newResults: Result[] = [...results, { q, picked: pickedIdx, correct, skipped: wasSkipped }];
    setResults(newResults);

    // Update persistent lists
    let newFailed = [...failedIds];
    let newSkipped = [...skippedIds];

    if (wasSkipped) {
      if (!newSkipped.includes(q.id)) newSkipped = [...newSkipped, q.id];
    } else {
      // Remove from skipped since they tried to answer it
      newSkipped = newSkipped.filter((id) => id !== q.id);
      if (correct) {
        // Answered correctly → remove from failed
        newFailed = newFailed.filter((id) => id !== q.id);
      } else {
        // Answered wrongly → add to failed
        if (!newFailed.includes(q.id)) newFailed = [...newFailed, q.id];
      }
    }

    setFailedIds(newFailed);
    setSkippedIds(newSkipped);
    saveMcqFailed(newFailed);
    saveMcqSkipped(newSkipped);

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

  // Retry only the questions failed in the current session
  function retrySessionFailed() {
    const sessionFailed = results.filter((r) => !r.correct && !r.skipped).map((r) => r.q);
    if (sessionFailed.length === 0) return;
    buildDeck(sessionFailed);
  }

  // Retry only the questions skipped in the current session
  function retrySessionSkipped() {
    const sessionSkipped = results.filter((r) => r.skipped).map((r) => r.q);
    if (sessionSkipped.length === 0) return;
    buildDeck(sessionSkipped);
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
        <ConfigPanel
          testMode={testMode}
          onTestMode={setTestMode}
          topicFilter={topicFilter}
          onTopicFilter={setTopicFilter}
          count={count}
          onCount={setCount}
          pool={pool}
          topicsWithMcq={topicsWithMcq}
          failedCount={failedIds.length}
          skippedCount={skippedIds.length}
          onStart={() => buildDeck()}
        />
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
          onNext={() => commitAnswer(picked, false)}
          onSkip={() => commitAnswer(null, true)}
          correctSoFar={results.filter((r) => r.correct).length}
          skippedSoFar={results.filter((r) => r.skipped).length}
        />
      )}

      {phase === 'done' && (
        <Summary
          results={results}
          onRestart={restart}
          onRetryFailed={retrySessionFailed}
          onRetrySkipped={retrySessionSkipped}
          persistedFailedCount={failedIds.length}
          persistedSkippedCount={skippedIds.length}
          onStartFailed={() => { setTestMode('failed'); buildDeck(MCQ.filter((m) => failedIds.includes(m.id))); }}
          onStartSkipped={() => { setTestMode('skipped'); buildDeck(MCQ.filter((m) => skippedIds.includes(m.id))); }}
        />
      )}
    </main>
  );
}

// ---- Config panel ----

function ConfigPanel({
  testMode, onTestMode,
  topicFilter, onTopicFilter,
  count, onCount,
  pool, topicsWithMcq,
  failedCount, skippedCount,
  onStart,
}: {
  testMode: TestMode;
  onTestMode: (m: TestMode) => void;
  topicFilter: string;
  onTopicFilter: (t: string) => void;
  count: number;
  onCount: (n: number) => void;
  pool: McqQuestion[];
  topicsWithMcq: { id: string; emoji: string; name: string }[];
  failedCount: number;
  skippedCount: number;
  onStart: () => void;
}) {
  const filteredCount = pool.length;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900 sm:p-8">
      <h1 className="text-xl font-medium text-zinc-900 dark:text-white">Test rápido</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        4 opciones, una correcta. Tras responder ves la explicación. Puedes saltar preguntas para después.
      </p>

      {/* Mode selector */}
      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">Modo</p>
        <div className="flex flex-wrap gap-2">
          <ModeButton active={testMode === 'all'} onClick={() => onTestMode('all')}>
            Todas ({MCQ.length})
          </ModeButton>
          <ModeButton
            active={testMode === 'failed'}
            onClick={() => onTestMode('failed')}
            disabled={failedCount === 0}
            variant="rose"
          >
            <Flag size={13} aria-hidden /> Falladas ({failedCount})
          </ModeButton>
          <ModeButton
            active={testMode === 'skipped'}
            onClick={() => onTestMode('skipped')}
            disabled={skippedCount === 0}
            variant="amber"
          >
            <SkipForward size={13} aria-hidden /> Omitidas ({skippedCount})
          </ModeButton>
        </div>
      </div>

      {/* Topic filter (only for 'all' mode) */}
      {testMode === 'all' && (
        <div className="mt-4">
          <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Tema
          </label>
          <select
            id="topic"
            value={topicFilter}
            onChange={(e) => onTopicFilter(e.target.value)}
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
      )}

      {/* Count selector */}
      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">¿Cuántas?</label>
        <div className="flex flex-wrap gap-2">
          {[5, 10, 20].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onCount(n)}
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
            onClick={() => onCount(filteredCount)}
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
        onClick={onStart}
        disabled={filteredCount === 0}
        className="mt-6 w-full rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-40"
      >
        Empezar test
      </button>
    </div>
  );
}

function ModeButton({
  active, onClick, disabled, children, variant = 'accent',
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'accent' | 'rose' | 'amber';
}) {
  const activeClass =
    variant === 'rose' ? 'border-rose-400 bg-rose-500 text-white'
    : variant === 'amber' ? 'border-amber-400 bg-amber-500 text-white'
    : 'border-accent bg-accent text-white';
  const hoverClass =
    variant === 'rose' ? 'hover:border-rose-400 hover:text-rose-500'
    : variant === 'amber' ? 'hover:border-amber-400 hover:text-amber-500'
    : 'hover:border-accent hover:text-accent';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition
        ${active ? activeClass : `border-zinc-300 text-zinc-600 dark:border-ink-600 dark:text-zinc-300 ${hoverClass}`}
        disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

// ---- Player ----

function Player({
  q, idx, total, picked, revealed,
  onPick, onSubmit, onNext, onSkip, correctSoFar, skippedSoFar,
}: {
  q: McqQuestion;
  idx: number;
  total: number;
  picked: number | null;
  revealed: boolean;
  onPick: (i: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  onSkip: () => void;
  correctSoFar: number;
  skippedSoFar: number;
}) {
  const topic = getTopic(q.topicId);
  return (
    <div>
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <span>{topic?.emoji} {topic?.name}</span>
          <span>{idx + 1} de {total} · {correctSoFar} aciertos</span>
        </div>
        <ProgressBar value={idx} max={total} skipped={skippedSoFar} label="Progreso del test" />
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
                    {revealed && isCorrect ? <Check size={14} aria-hidden />
                      : revealed && isPicked ? <X size={14} aria-hidden />
                      : String.fromCharCode(65 + i)}
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

        <div className="mt-5 flex gap-2">
          {!revealed ? (
            <>
              <button
                type="button"
                onClick={onSubmit}
                disabled={picked === null}
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-40"
              >
                Responder
              </button>
              <button
                type="button"
                onClick={onSkip}
                title="Saltar y guardar para repasar"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-500 transition hover:border-amber-400 hover:text-amber-600 dark:border-ink-600 dark:text-zinc-400"
              >
                <SkipForward size={15} aria-hidden />
                Saltar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90"
            >
              {idx + 1 === total ? 'Ver resultados' : 'Siguiente →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Summary ----

function Summary({
  results, onRestart,
  onRetryFailed, onRetrySkipped,
  persistedFailedCount, persistedSkippedCount,
  onStartFailed, onStartSkipped,
}: {
  results: Result[];
  onRestart: () => void;
  onRetryFailed: () => void;
  onRetrySkipped: () => void;
  persistedFailedCount: number;
  persistedSkippedCount: number;
  onStartFailed: () => void;
  onStartSkipped: () => void;
}) {
  const correct = results.filter((r) => r.correct).length;
  const skipped = results.filter((r) => r.skipped).length;
  const answered = results.length - skipped;
  const total = results.length;
  const pct = answered ? Math.round((correct / answered) * 100) : 0;
  const failed = results.filter((r) => !r.correct && !r.skipped);
  const skippedResults = results.filter((r) => r.skipped);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900 sm:p-8">
      {/* Score */}
      <div className="text-center">
        <Trophy size={40} className="mx-auto mb-3 text-amber-500" aria-hidden />
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">{correct} / {answered}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {pct}% de aciertos
          {skipped > 0 && <span className="ml-2">· {skipped} omitidas</span>}
        </p>
        <div className="mx-auto mt-4 max-w-xs">
          <ProgressBar value={correct} max={answered || 1} label="Resultado" />
        </div>
      </div>

      {/* Session retry buttons */}
      {(failed.length > 0 || skippedResults.length > 0) && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {failed.length > 0 && (
            <button
              type="button"
              onClick={onRetryFailed}
              className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
            >
              <Flag size={14} aria-hidden /> Repetir falladas ({failed.length})
            </button>
          )}
          {skippedResults.length > 0 && (
            <button
              type="button"
              onClick={onRetrySkipped}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
            >
              <SkipForward size={14} aria-hidden /> Repasar omitidas ({skippedResults.length})
            </button>
          )}
        </div>
      )}

      {/* Failed review */}
      {failed.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            <Flag size={14} className="text-rose-500" aria-hidden />
            Falladas ({failed.length}) — guardadas para repasar:
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
                    Marcaste: <span className="text-rose-600 dark:text-rose-400">{picked !== null ? q.options[picked] : '—'}</span>
                  </p>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                    Correcta: <span className="text-emerald-600 dark:text-emerald-400">{q.options[q.correctIndex]}</span>
                  </p>
                  <div className="mt-3 border-t border-rose-100 pt-3 dark:border-rose-900/30">
                    <Markdown>{q.explanation}</Markdown>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Skipped review */}
      {skippedResults.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            <SkipForward size={14} className="text-amber-500" aria-hidden />
            Omitidas ({skippedResults.length}) — guardadas para repasar:
          </h2>
          <ul className="space-y-2">
            {skippedResults.map(({ q }) => {
              const topic = getTopic(q.topicId);
              return (
                <li key={q.id} className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
                  <p className="text-[0.7rem] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    {topic?.emoji} {topic?.name}
                  </p>
                  <p className="mt-1 font-medium text-zinc-900 dark:text-white">{q.question}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Persisted totals banner */}
      {(persistedFailedCount > 0 || persistedSkippedCount > 0) && (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-ink-800">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Acumulado en todos tus tests
          </p>
          <div className="flex flex-wrap gap-3">
            {persistedFailedCount > 0 && (
              <button
                type="button"
                onClick={onStartFailed}
                className="flex items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
              >
                <Flag size={13} aria-hidden /> {persistedFailedCount} falladas acumuladas → test
              </button>
            )}
            {persistedSkippedCount > 0 && (
              <button
                type="button"
                onClick={onStartSkipped}
                className="flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-600 transition hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
              >
                <SkipForward size={13} aria-hidden /> {persistedSkippedCount} omitidas acumuladas → test
              </button>
            )}
          </div>
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
