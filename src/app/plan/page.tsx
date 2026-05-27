'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Layers, ListChecks } from 'lucide-react';
import { STUDY_PLAN } from '@/data/studyPlan';
import { getTopic, questionsByTopic } from '@/lib/data';
import { topicStats } from '@/lib/srs';
import { loadPlanDone, savePlanDone, loadProgress } from '@/lib/storage';
import type { Progress } from '@/lib/types';
import ProgressBar from '@/components/ProgressBar';

export default function PlanPage() {
  const [done, setDone] = useState<number[]>([]);
  const [progress, setProgress] = useState<Progress>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDone(loadPlanDone());
    setProgress(loadProgress());
    setHydrated(true);
  }, []);

  function toggle(day: number) {
    setDone((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      savePlanDone(next);
      return next;
    });
  }

  const completed = done.length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Inicio
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Plan de estudio · 6 días</span>
        <span className="w-12" aria-hidden />
      </div>

      <header className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Cuenta atrás para la entrevista</h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{hydrated ? `${completed} / 6 días` : '…'}</span>
        </div>
        <ProgressBar value={completed} max={6} label="Días completados" />
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Foco en lo que más pesa: <strong className="text-rose-500">SQL</strong> y modelado (día 5),{' '}
          <strong className="text-amber-500">hexagonal/DDD</strong> (día 3) y async/reactivo (día 4). Cada día, 20 min de{' '}
          <Link href="/mix/" className="text-accent underline">repaso aleatorio</Link>.
        </p>
      </header>

      <ol className="space-y-4">
        {STUDY_PLAN.map((d) => {
          const isDone = done.includes(d.day);
          return (
            <li
              key={d.day}
              className={`rounded-2xl border p-5 transition ${
                isDone
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/20'
                  : 'border-zinc-200 bg-white dark:border-ink-700 dark:bg-ink-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">
                    Día {d.day} · {d.hours}
                  </p>
                  <h2 className="mt-0.5 text-lg font-medium text-zinc-900 dark:text-white">{d.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(d.day)}
                  aria-pressed={isDone}
                  aria-label={isDone ? `Marcar día ${d.day} como pendiente` : `Marcar día ${d.day} como completado`}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    isDone
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'border border-zinc-300 text-zinc-500 hover:border-emerald-500 hover:text-emerald-600 dark:border-ink-600 dark:text-zinc-400'
                  }`}
                >
                  <Check size={15} aria-hidden /> {isDone ? 'Hecho' : 'Marcar'}
                </button>
              </div>

              <ul className="mt-3 space-y-1.5">
                {d.points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400" aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              {/* Deep links a los topics del día */}
              <div className="mt-4 flex flex-wrap gap-2">
                {d.topics.map((tid) => {
                  const topic = getTopic(tid);
                  if (!topic) return null;
                  const st = topicStats(questionsByTopic(tid), progress);
                  return (
                    <div
                      key={tid}
                      className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs dark:border-ink-700 dark:bg-ink-800"
                    >
                      <span aria-hidden>{topic.emoji}</span>
                      <span className="text-zinc-600 dark:text-zinc-300">{topic.name}</span>
                      {hydrated && <span className="text-zinc-400">· {st.knownPct}%</span>}
                      <Link
                        href={`/flashcards/${tid}/`}
                        className="ml-1 flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-white"
                        aria-label={`Flashcards de ${topic.name}`}
                      >
                        <Layers size={12} aria-hidden />
                      </Link>
                      <Link
                        href={`/quiz/${tid}/`}
                        className="flex items-center gap-1 rounded border border-zinc-300 px-1.5 py-0.5 text-zinc-600 dark:border-ink-600 dark:text-zinc-300"
                        aria-label={`Quiz de ${topic.name}`}
                      >
                        <ListChecks size={12} aria-hidden />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
