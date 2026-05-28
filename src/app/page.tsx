'use client';

import Link from 'next/link';
import { BookOpen, CalendarDays, FileText, MessageSquare, PenTool, RotateCcw, Shuffle, Timer, UserRound } from 'lucide-react';
import { questions, questionsByTopic, topicsByPriority } from '@/lib/data';
import { topicStats } from '@/lib/srs';
import { useProgress } from '@/lib/useProgress';
import { getCard } from '@/lib/storage';
import TopicCard from '@/components/TopicCard';
import SearchBar from '@/components/SearchBar';
import ThemeToggle from '@/components/ThemeToggle';
import ExportImport from '@/components/ExportImport';
import ProgressBar from '@/components/ProgressBar';

export default function Home() {
  const { progress, hydrated, reload } = useProgress();

  const totalKnown = questions.filter((q) => getCard(progress, q.id).status === 'known').length;
  const totalReview = questions.filter((q) => getCard(progress, q.id).status === 'review').length;
  const globalPct = questions.length ? Math.round((totalKnown / questions.length) * 100) : 0;

  // Order topics by interview priority (risk first, then least-known).
  const knownPctById = Object.fromEntries(
    topicsByPriority({}).map((t) => [t.id, topicStats(questionsByTopic(t.id), progress).knownPct]),
  );
  const orderedTopics = topicsByPriority(knownPctById);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
              Interview Prep
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Arquitectura · Spring · Java · Kafka · SQL · DDD — flashcards y quiz, offline.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <SearchBar />
      </header>

      {/* Global progress */}
      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Progreso global</h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {hydrated ? `${totalKnown} / ${questions.length} conocidas · ${globalPct}%` : '…'}
          </span>
        </div>
        <ProgressBar value={totalKnown} max={questions.length} label="Progreso global" />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href="/plan/"
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <CalendarDays size={15} aria-hidden /> Plan de estudio
          </Link>
          <Link
            href="/mock/"
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <MessageSquare size={15} aria-hidden /> Simulacro
          </Link>
          <Link
            href="/simulacro/"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
          >
            <Timer size={15} aria-hidden /> Simulacro completo
          </Link>
          <Link
            href="/design/"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
          >
            <PenTool size={15} aria-hidden /> Diseño
          </Link>
          <Link
            href="/experiencia/"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
          >
            <UserRound size={15} aria-hidden /> Tu experiencia
          </Link>
          <Link
            href="/teoria/"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
          >
            <BookOpen size={15} aria-hidden /> Teoría
          </Link>
          <Link
            href="/chuletas/"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
          >
            <FileText size={15} aria-hidden /> Chuletas
          </Link>
          <Link
            href="/mix/"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
          >
            <Shuffle size={15} aria-hidden /> Repaso diario
          </Link>
          <Link
            href="/review/"
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-amber-950 transition hover:bg-amber-400"
          >
            <RotateCcw size={15} aria-hidden /> Marcadas ({totalReview})
          </Link>
          <ExportImport onImported={reload} />
        </div>
      </section>

      {/* Topics grid — ordered by interview priority */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Temas
          </h2>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">por prioridad de estudio ↓</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} stats={topicStats(questionsByTopic(topic.id), progress)} />
          ))}
        </div>
      </section>

      <footer className="mt-12 text-center text-xs text-zinc-400 dark:text-zinc-600">
        {questions.length} preguntas · El progreso se guarda en tu navegador (localStorage).
      </footer>
    </main>
  );
}
