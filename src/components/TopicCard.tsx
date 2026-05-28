'use client';

import Link from 'next/link';
import { Layers, ListChecks } from 'lucide-react';
import type { Topic } from '@/lib/types';
import type { TopicStats } from '@/lib/srs';
import ProgressBar from './ProgressBar';
import RiskBadge from './RiskBadge';

export default function TopicCard({ topic, stats }: { topic: Topic; stats: TopicStats }) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-accent/60 hover:shadow dark:border-ink-700 dark:bg-ink-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>{topic.emoji}</span>
          <div>
            <h2 className="font-medium leading-tight text-zinc-900 dark:text-white">{topic.name}</h2>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{stats.total} preguntas</p>
              {topic.risk && <RiskBadge risk={topic.risk} />}
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-ink-800 dark:text-zinc-300">
          {stats.knownPct}%
        </span>
      </div>

      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">{topic.description}</p>

      <div className="mb-4 mt-auto">
        <ProgressBar value={stats.known} max={stats.total} label={`${stats.known} de ${stats.total} conocidas`} />
        <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          {stats.known} conocidas · {stats.review} a repasar · {stats.newCount} nuevas
          {stats.skipped > 0 && ` · ${stats.skipped} saltadas`}
        </p>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/flashcards/${topic.id}/`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Layers size={15} aria-hidden /> Flashcards
        </Link>
        <Link
          href={`/quiz/${topic.id}/`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-200"
        >
          <ListChecks size={15} aria-hidden /> Quiz
        </Link>
      </div>
    </div>
  );
}
