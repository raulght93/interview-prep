'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Flame, Lock } from 'lucide-react';
import { ACHIEVEMENTS, computeStats, unlockedAchievements, type Achievement } from '@/data/achievements';
import { loadProgress, loadUnlocked, readStreak } from '@/lib/storage';
import type { Progress } from '@/lib/types';

export default function LogrosPage() {
  const [progress, setProgress] = useState<Progress>({});
  const [streak, setStreak] = useState(0);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setStreak(readStreak());
    setUnlockedIds(loadUnlocked());
    setHydrated(true);
  }, []);

  const stats = computeStats(progress, streak, unlockedIds);
  const unlockedSet = new Set(unlockedAchievements(stats).map((a) => a.id));
  const totalUnlocked = unlockedSet.size;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-accent dark:text-zinc-400">
          <ArrowLeft size={16} aria-hidden /> Inicio
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Logros</span>
        <span className="w-12" aria-hidden />
      </div>

      {/* Cabecera de progreso */}
      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Logros" value={hydrated ? `${totalUnlocked} / ${ACHIEVEMENTS.length}` : '…'} emoji="🏆" />
        <Stat
          label="Racha"
          value={hydrated ? `${streak} ${streak === 1 ? 'día' : 'días'}` : '…'}
          emoji={streak >= 7 ? '🔥🔥' : streak >= 3 ? '🔥' : '☀️'}
        />
        <Stat label="Cards dominadas" value={hydrated ? `${stats.knownTotal} / ${stats.totalCards}` : '…'} emoji="📚" />
      </section>

      {/* Lista de logros */}
      <ul className="space-y-3">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = unlockedSet.has(a.id);
          return <AchievementRow key={a.id} a={a} unlocked={isUnlocked} />;
        })}
      </ul>

      <p className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
        🔥 La racha se cuenta por días naturales — abre la app cada día para no perderla.
      </p>
    </main>
  );
}

function Stat({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 flex items-baseline gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
        <span aria-hidden>{emoji}</span> {value}
      </p>
    </div>
  );
}

function AchievementRow({ a, unlocked }: { a: Achievement; unlocked: boolean }) {
  return (
    <li
      className={`flex gap-3 rounded-2xl border p-4 transition ${
        unlocked
          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
          : 'border-zinc-200 bg-white opacity-70 dark:border-ink-700 dark:bg-ink-900'
      }`}
    >
      <div className="text-3xl" aria-hidden>
        {unlocked ? a.emoji : <Lock size={26} className="text-zinc-400" />}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${unlocked ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
          {unlocked ? a.title : a.secret ? '???' : a.title}
        </p>
        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">
          {unlocked ? a.desc : a.secret ? 'Hay un logro escondido por aquí…' : a.hint}
        </p>
      </div>
    </li>
  );
}
