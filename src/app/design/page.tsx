'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ListChecks, Lightbulb } from 'lucide-react';
import { DESIGN_EXERCISES, type DesignExercise } from '@/data/designExercises';
import Markdown from '@/components/Markdown';

export default function DesignPage() {
  const [active, setActive] = useState<DesignExercise | null>(null);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Inicio
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Ejercicio de diseño</span>
        <span className="w-12" aria-hidden />
      </div>

      {!active ? (
        <div>
          <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
            “Te doy unos requisitos, plantea la solución.” Lee el caso, esboza tu enfoque, y luego compara
            con la rúbrica (qué deberías tocar) y un planteamiento modelo.
          </p>
          <ul className="space-y-3">
            {DESIGN_EXERCISES.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setActive(e)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-accent/60 dark:border-ink-700 dark:bg-ink-900"
                >
                  <span className="text-2xl" aria-hidden>{e.emoji}</span>
                  <span className="flex-1">
                    <span className="block font-medium text-zinc-900 dark:text-white">{e.title}</span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">{e.context}</span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-zinc-400" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ExerciseView exercise={active} onExit={() => setActive(null)} />
      )}
    </main>
  );
}

function ExerciseView({ exercise, onExit }: { exercise: DesignExercise; onExit: () => void }) {
  const [notes, setNotes] = useState('');
  const [showRubric, setShowRubric] = useState(false);
  const [showModel, setShowModel] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={onExit}
        className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400"
      >
        <ArrowLeft size={15} aria-hidden /> Casos
      </button>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
          <span aria-hidden>{exercise.emoji}</span> {exercise.title}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{exercise.context}</p>
        <h2 className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-400">Requisitos</h2>
        <ul className="mt-1.5 space-y-1">
          {exercise.requirements.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <span className="text-accent">{i + 1}.</span> {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Tu enfoque */}
      <div className="mt-4">
        <label htmlFor="design-notes" className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Tu enfoque (esbózalo antes de mirar):
        </label>
        <textarea
          id="design-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Dominio, bounded contexts, puertos/adaptadores, integración (sync/eventos), persistencia, resiliencia, NFRs…"
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-accent dark:border-ink-600 dark:bg-ink-800 dark:text-zinc-100"
        />
      </div>

      {/* Rúbrica */}
      <div className="mt-4">
        {!showRubric ? (
          <button
            type="button"
            onClick={() => setShowRubric(true)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
          >
            <ListChecks size={15} aria-hidden /> Ver rúbrica (¿qué he tocado?)
          </button>
        ) : (
          <div className="animate-fade-scale rounded-2xl border border-zinc-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              <ListChecks size={16} aria-hidden /> Rúbrica — marca lo que mencionaste
            </h2>
            <div className="space-y-3">
              {exercise.rubric.map((area) => (
                <div key={area.area}>
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">{area.area}</p>
                  <ul className="mt-1 space-y-1">
                    {area.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                        <input type="checkbox" className="mt-1 accent-emerald-600" aria-label={p} />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modelo */}
      <div className="mt-4">
        {!showModel ? (
          <button
            type="button"
            onClick={() => setShowModel(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Lightbulb size={15} aria-hidden /> Ver planteamiento modelo
          </button>
        ) : (
          <div className="animate-fade-scale rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <Lightbulb size={16} aria-hidden /> Planteamiento modelo
            </h2>
            <Markdown>{exercise.model}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
