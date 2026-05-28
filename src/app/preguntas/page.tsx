'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Star } from 'lucide-react';
import { INTERVIEWER_SECTIONS, ESSENTIAL_QUESTIONS } from '@/data/interviewerQuestions';

export default function PreguntasPage() {
  const [open, setOpen] = useState<Set<string>>(new Set(INTERVIEWER_SECTIONS.map((s) => s.id)));

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Inicio
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Preguntas para el entrevistador</span>
        <span className="w-12" aria-hidden />
      </div>
      <h1 className="mb-2 hidden text-2xl font-semibold text-zinc-900 print:block">Preguntas para el entrevistador</h1>

      <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400 print:hidden">
        Hacer buenas preguntas al final de la entrevista cuenta tanto como contestar las suyas: muestra
        interés genuino, evalúas si el sitio te conviene, y los buenos entrevistadores te lo notan.
      </p>

      {/* Esenciales */}
      <section className="mb-6 rounded-2xl border border-accent/30 bg-accent/5 p-5 dark:bg-accent/10">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-accent">
          <Star size={15} aria-hidden /> Las 5 esenciales (no te vayas sin estas)
        </h2>
        <ol className="space-y-1.5">
          {ESSENTIAL_QUESTIONS.map((q, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <span className="text-accent">{i + 1}.</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="space-y-3">
        {INTERVIEWER_SECTIONS.map((section) => {
          const isOpen = open.has(section.id);
          return (
            <section
              key={section.id}
              className="rounded-2xl border border-zinc-200 bg-white dark:border-ink-700 dark:bg-ink-900"
            >
              <button
                type="button"
                onClick={() => toggle(section.id)}
                aria-expanded={isOpen}
                className="flex w-full min-h-[48px] items-center gap-2 px-5 py-3 text-left"
              >
                <span className="text-xl" aria-hidden>{section.emoji}</span>
                <span className="font-medium text-zinc-900 dark:text-white">{section.title}</span>
                <span className="text-xs text-zinc-400">({section.questions.length})</span>
                <ChevronDown
                  size={16}
                  className={`ml-auto text-zinc-400 transition-transform print:hidden ${isOpen ? '' : '-rotate-90'}`}
                  aria-hidden
                />
              </button>
              <div className={`border-t border-zinc-100 px-5 py-4 dark:border-ink-800 ${isOpen ? '' : 'hidden print:block'}`}>
                <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400 print:hidden">{section.intro}</p>
                <ol className="space-y-3">
                  {section.questions.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                      <span className="shrink-0 text-accent">{i + 1}.</span>
                      <div className="flex-1">
                        <p>{item.q}</p>
                        {item.why && (
                          <p className="mt-1 text-xs italic text-zinc-500 dark:text-zinc-400">
                            💡 {item.why}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
        Imprimible con Cmd/Ctrl+P · Lleva las 5 esenciales memorizadas; el resto, en una hoja.
      </p>
    </main>
  );
}
