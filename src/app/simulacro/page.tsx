'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, MessageSquare, Pause, Play, RotateCcw } from 'lucide-react';
import { FULL_SIMULACRO } from '@/data/mockInterviews';
import Markdown from '@/components/Markdown';

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function SimulacroPage() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  function start() {
    setStarted(true);
    setRunning(true);
    setStep(0);
    setRevealed(false);
    setElapsed(0);
  }

  const turn = FULL_SIMULACRO[step];
  const isLast = step === FULL_SIMULACRO.length - 1;
  const done = started && step >= FULL_SIMULACRO.length;

  function next() {
    setRevealed(false);
    if (isLast) setRunning(false);
    setStep((s) => s + 1);
  }

  return (
    <main className="mx-auto max-w-card px-4 py-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Inicio
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Simulacro completo</span>
        {started ? (
          <span className={`font-mono text-sm tabular-nums ${elapsed > 45 * 60 ? 'text-rose-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {fmt(elapsed)}
          </span>
        ) : (
          <span className="w-12" aria-hidden />
        )}
      </div>

      {!started ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-ink-700 dark:bg-ink-900 sm:p-8">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Entrevista de principio a fin</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {FULL_SIMULACRO.length} preguntas mezclando todos los temas (experiencia, Java, Spring, hexagonal,
            Kafka, SQL, testing…), como una entrevista real. Objetivo orientativo: ~45 min. Cronómetro incluido.
          </p>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Responde <strong>en voz alta</strong> antes de revelar cada respuesta. Sin pausa mental: simula presión.
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition hover:opacity-90"
          >
            <Play size={16} aria-hidden /> Empezar
          </button>
        </div>
      ) : done ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
          <p className="text-lg font-medium text-zinc-900 dark:text-white">Simulacro completado 🎯</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {FULL_SIMULACRO.length} preguntas en <strong>{fmt(elapsed)}</strong>. ¿Te has quedado claro en algún
            bloque? Repásalo con sus flashcards o el simulacro temático.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={start}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90"
            >
              <RotateCcw size={16} aria-hidden /> Otra vez
            </button>
            <Link href="/mock/" className="rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200">
              Simulacros por tema
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Pregunta {step + 1} de {FULL_SIMULACRO.length}</span>
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className="flex items-center gap-1 text-xs text-zinc-500 transition hover:text-accent dark:text-zinc-400"
              aria-label={running ? 'Pausar cronómetro' : 'Reanudar cronómetro'}
            >
              {running ? <><Pause size={13} aria-hidden /> Pausar</> : <><Play size={13} aria-hidden /> Reanudar</>}
            </button>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-ink-700">
            <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(step / FULL_SIMULACRO.length) * 100}%` }} />
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <MessageSquare size={16} aria-hidden />
              </span>
              <div className="rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-4 py-3 dark:border-ink-700 dark:bg-ink-900">
                <p className="text-[0.7rem] font-medium uppercase tracking-wide text-zinc-400">Entrevistador</p>
                <p className="mt-1 text-zinc-900 dark:text-white">{turn.interviewer}</p>
              </div>
            </div>

            {revealed ? (
              <div className="ml-6 sm:ml-10 animate-fade-scale rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <p className="mb-1 text-[0.7rem] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Puntos a tocar</p>
                <Markdown>{turn.model}</Markdown>
                <button
                  type="button"
                  onClick={next}
                  className="mt-3 flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
                >
                  {isLast ? 'Terminar' : 'Siguiente'} <ArrowRight size={15} aria-hidden />
                </button>
              </div>
            ) : (
              <div className="ml-6 sm:ml-10">
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  <Eye size={15} aria-hidden /> Ver respuesta
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
