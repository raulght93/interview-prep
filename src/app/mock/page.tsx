'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, MessageSquare, RotateCcw, Layers } from 'lucide-react';
import { MOCK_SESSIONS, type MockSession } from '@/data/mockInterviews';
import Markdown from '@/components/Markdown';

export default function MockPage() {
  const [active, setActive] = useState<MockSession | null>(null);

  return (
    <main className="mx-auto max-w-card px-4 py-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Inicio
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Simulación de entrevista</span>
        <span className="w-12" aria-hidden />
      </div>

      {!active ? (
        <div>
          <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
            Conversaciones al estilo real: el entrevistador hace una pregunta y va profundizando con
            follow-ups. Responde mentalmente o en voz alta, y luego compara con la respuesta modelo.
          </p>
          <ul className="space-y-3">
            {MOCK_SESSIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActive(s)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-accent/60 dark:border-ink-700 dark:bg-ink-900"
                >
                  <span className="text-2xl" aria-hidden>{s.emoji}</span>
                  <span className="flex-1">
                    <span className="block font-medium text-zinc-900 dark:text-white">{s.title}</span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {s.turns.length} preguntas · {s.intro}
                    </span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-zinc-400" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <SessionPlayer session={active} onExit={() => setActive(null)} />
      )}
    </main>
  );
}

function SessionPlayer({ session, onExit }: { session: MockSession; onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const turn = session.turns[step];
  const isLast = step === session.turns.length - 1;

  function next() {
    setRevealed(false);
    setStep((s) => s + 1);
  }

  const done = step >= session.turns.length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400"
        >
          <ArrowLeft size={15} aria-hidden /> Sesiones
        </button>
        <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          <span aria-hidden>{session.emoji}</span> {session.title}
        </span>
        <span className="text-xs text-zinc-400">
          {Math.min(step + 1, session.turns.length)}/{session.turns.length}
        </span>
      </div>

      {!done ? (
        <div className="space-y-4">
          {/* Interviewer bubble */}
          <div className="flex gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <MessageSquare size={16} aria-hidden />
            </span>
            <div className="rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-4 py-3 dark:border-ink-700 dark:bg-ink-900">
              <p className="text-[0.7rem] font-medium uppercase tracking-wide text-zinc-400">Entrevistador</p>
              <p className="mt-1 text-zinc-900 dark:text-white">{turn.interviewer}</p>
            </div>
          </div>

          {/* Model answer */}
          {revealed ? (
            <div className="ml-6 sm:ml-10 animate-fade-scale rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <p className="mb-1 text-[0.7rem] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Respuesta modelo / puntos a tocar
              </p>
              <Markdown>{turn.model}</Markdown>
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
              <p className="mt-2 text-xs text-zinc-400">Responde tú primero, en voz alta.</p>
            </div>
          )}

          {revealed && (
            <div className="ml-6 sm:ml-10">
              <button
                type="button"
                onClick={next}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
              >
                {isLast ? 'Terminar' : 'Siguiente pregunta'} <ArrowRight size={15} aria-hidden />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">
          <p className="text-lg font-medium text-zinc-900 dark:text-white">Sesión terminada 🎯</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Has pasado por las {session.turns.length} preguntas de “{session.title}”.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setStep(0);
                setRevealed(false);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90"
            >
              <RotateCcw size={16} aria-hidden /> Repetir
            </button>
            {session.topic && (
              <Link
                href={`/flashcards/${session.topic}/`}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
              >
                <Layers size={16} aria-hidden /> Flashcards del tema
              </Link>
            )}
            <button
              type="button"
              onClick={onExit}
              className="rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
            >
              Otras sesiones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
