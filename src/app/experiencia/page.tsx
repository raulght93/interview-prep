'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import {
  PITCH,
  PITCH_NOTE,
  TECH_MATRIX,
  TIMELINE,
  SELL,
  COVER,
  REVERSE_QUESTIONS,
  type TechRow,
} from '@/data/experience';
import Markdown from '@/components/Markdown';

const levelStyle: Record<TechRow['level'], string> = {
  fuerte: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200',
  medio: 'bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200',
  conceptual: 'bg-zinc-200 text-zinc-700 dark:bg-ink-700 dark:text-zinc-300',
};

export default function ExperienciaPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Inicio
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Resumen de experiencia</span>
        <span className="w-12" aria-hidden />
      </div>
      <h1 className="mb-2 hidden text-2xl font-semibold text-zinc-900 print:block">Resumen de experiencia</h1>

      {/* Pitch */}
      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
        <h1 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">Tu pitch (30-45s)</h1>
        <Markdown>{PITCH}</Markdown>
        <p className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
          💡 {PITCH_NOTE}
        </p>
      </section>

      {/* Tech matrix */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Matriz de tecnologías
        </h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-ink-700">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-zinc-100 dark:divide-ink-800">
              {TECH_MATRIX.map((row) => (
                <tr key={row.tech} className="bg-white dark:bg-ink-900">
                  <td className="px-3 py-2.5 font-medium text-zinc-800 dark:text-zinc-100">{row.tech}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelStyle[row.level]}`}>
                      {row.level}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500 dark:text-zinc-400">{row.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Timeline */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Trayectoria
        </h2>
        <ol className="space-y-3">
          {TIMELINE.map((t, i) => (
            <li key={i} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-zinc-900 dark:text-white">{t.org}</span>
                <span className="shrink-0 text-xs text-zinc-400">{t.period}</span>
              </div>
              <p className="text-xs text-accent">{t.role}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t.stack}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Sell / Cover */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={16} aria-hidden /> Puntos fuertes a vender
          </h2>
          <ul className="space-y-1.5">
            {SELL.map((s, i) => (
              <li key={i} className="text-sm text-zinc-600 dark:text-zinc-300">• {s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
            <AlertTriangle size={16} aria-hidden /> A cubrir con honestidad
          </h2>
          <ul className="space-y-1.5">
            {COVER.map((s, i) => (
              <li key={i} className="text-sm text-zinc-600 dark:text-zinc-300">• {s}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Reverse questions */}
      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          <HelpCircle size={16} aria-hidden /> Preguntas para hacerles tú
        </h2>
        <ul className="space-y-2">
          {REVERSE_QUESTIONS.map((q, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <span className="text-accent">{i + 1}.</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
        Personaliza todo esto — es tu material, no un guion rígido. Imprimible con Ctrl/Cmd+P.
      </p>
    </main>
  );
}
