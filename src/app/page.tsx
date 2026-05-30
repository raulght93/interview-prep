'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, CalendarDays, CheckCircle2, ChevronRight, FileText, Flame, HelpCircle, ListChecks,
  MessageSquare, PenTool, RotateCcw, Shuffle, Sparkles, Timer, Trophy, UserRound, X,
  type LucideIcon,
} from 'lucide-react';
import { questions, questionsByTopic, topicsByPriority } from '@/lib/data';
import { topicStats } from '@/lib/srs';
import { useProgress } from '@/lib/useProgress';
import { getCard, loadUnlocked, saveUnlocked, tickStreak } from '@/lib/storage';
import { computeStats, newlyUnlocked, unlockedAchievements, type Achievement } from '@/data/achievements';
import TopicCard from '@/components/TopicCard';
import SearchBar from '@/components/SearchBar';
import ThemeToggle from '@/components/ThemeToggle';
import ExportImport from '@/components/ExportImport';
import ProgressBar from '@/components/ProgressBar';
import CloudSync from '@/components/CloudSync';

interface Tool {
  href: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  accent?: boolean;
}

const TOOLS: { section: string; tools: Tool[] }[] = [
  {
    section: '📚 Estudiar',
    tools: [
      { href: '/plan/', label: 'Plan de 6 días', desc: 'Itinerario diario con bullets y deep-links.', icon: CalendarDays, accent: true },
      { href: '/mix/', label: 'Repaso diario', desc: '20 cards aleatorias priorizando lo no visto y lo marcado.', icon: Shuffle },
      { href: '/review/', label: 'Marcadas', desc: 'Cards que marcaste para repasar.', icon: RotateCcw },
    ],
  },
  {
    section: '🎯 Practicar',
    tools: [
      { href: '/mock/', label: 'Simulacro temático', desc: 'Conversación con drilling por bloque (hexagonal, Kafka, SQL…).', icon: MessageSquare, accent: true },
      { href: '/simulacro/', label: 'Simulacro completo', desc: 'Entrevista cronometrada de principio a fin, mezclando temas.', icon: Timer },
      { href: '/test/', label: 'Test (selección múltiple)', desc: 'Preguntas con 4 opciones y explicación tras responder.', icon: ListChecks },
      { href: '/design/', label: 'Diseño', desc: '"Te doy unos requisitos, plantea la solución" con rúbrica.', icon: PenTool },
    ],
  },
  {
    section: '📖 Referencia',
    tools: [
      { href: '/teoria/', label: 'Teoría', desc: 'Resúmenes que atan los conceptos clave de cada bloque.', icon: BookOpen },
      { href: '/chuletas/', label: 'Chuletas', desc: 'Puntos clave por bloque para el repaso de última hora.', icon: FileText },
      { href: '/experiencia/', label: 'Tu experiencia', desc: 'Pitch, matriz de tech, trayectoria, puntos a vender/cubrir.', icon: UserRound },
      { href: '/preguntas/', label: 'Preguntas para ellos', desc: 'Categorizadas + 5 esenciales para hacer al entrevistador.', icon: HelpCircle },
      { href: '/logros/', label: 'Logros', desc: 'Tu progreso gamificado: racha, logros desbloqueables, hitos.', icon: Trophy },
    ],
  },
];

const WELCOME_KEY = 'interview-prep-welcome-v1';

export default function Home() {
  const { progress, hydrated, reload } = useProgress();

  const totalKnown   = questions.filter((q) => getCard(progress, q.id).status === 'known').length;
  const totalReview  = questions.filter((q) => getCard(progress, q.id).status === 'review').length;
  const totalSkipped = questions.filter((q) => getCard(progress, q.id).status === 'skipped').length;
  const globalPct = questions.length ? Math.round((totalKnown / questions.length) * 100) : 0;

  // Order topics by interview priority (risk first, then least-known).
  const knownPctById = Object.fromEntries(
    topicsByPriority({}).map((t) => [t.id, topicStats(questionsByTopic(t.id), progress).knownPct]),
  );
  const orderedTopics = topicsByPriority(knownPctById);

  // First-visit welcome banner — dismissible, remembered in localStorage.
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.localStorage.getItem(WELCOME_KEY)) {
      setShowWelcome(true);
    }
  }, []);

  // Streak (días consecutivos) — tickea al cargar la home.
  const [streak, setStreak] = useState(0);
  // Toast de nuevos logros desbloqueados.
  const [toast, setToast] = useState<Achievement[]>([]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const days = tickStreak();
    setStreak(days);
    // Detectar nuevos logros y persistirlos.
    if (hydrated) {
      const prev = loadUnlocked();
      const stats = computeStats(progress, days, prev);
      const news = newlyUnlocked(stats, prev);
      if (news.length > 0) {
        setToast(news);
        const all = unlockedAchievements(stats).map((a) => a.id);
        saveUnlocked(all);
        // Auto-dismiss tras 6s.
        setTimeout(() => setToast([]), 6000);
      } else if (prev.length === 0) {
        // Inicializa la lista si nunca se guardó.
        const all = unlockedAchievements(stats).map((a) => a.id);
        if (all.length > 0) saveUnlocked(all);
      }
    }
  }, [hydrated, progress]);
  function dismissWelcome() {
    setShowWelcome(false);
    try {
      window.localStorage.setItem(WELCOME_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
              Interview Prep
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Arquitectura · Spring · Java · Kafka · SQL · DDD — flashcards, quiz, simulacros, offline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hydrated && streak >= 1 && (
              <Link
                href="/logros/"
                className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-900 transition hover:border-amber-400 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
                aria-label={`Racha de ${streak} días`}
                title={`Llevas ${streak} ${streak === 1 ? 'día' : 'días'} seguidos`}
              >
                <Flame size={15} aria-hidden /> {streak}
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>

        <SearchBar />
      </header>

      {/* Toast de logros recién desbloqueados */}
      {toast.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(360px,90vw)] -translate-x-1/2 space-y-2 print:hidden">
          {toast.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-white px-4 py-3 shadow-lg dark:border-emerald-700 dark:bg-ink-900"
              role="status"
            >
              <span className="text-2xl" aria-hidden>{a.emoji}</span>
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  ¡Logro desbloqueado!
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{a.title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{a.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setToast((t) => t.filter((x) => x.id !== a.id))}
                aria-label="Cerrar"
                className="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* First-visit welcome */}
      {showWelcome && (
        <section className="relative mb-6 rounded-2xl border border-accent/30 bg-accent/5 p-5 dark:bg-accent/10">
          <button
            type="button"
            onClick={dismissWelcome}
            aria-label="Cerrar bienvenida"
            className="absolute right-3 top-3 rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X size={16} aria-hidden />
          </button>
          <p className="flex items-center gap-1.5 text-sm font-medium text-accent">
            <Sparkles size={15} aria-hidden /> Empieza por aquí
          </p>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">
            La forma rápida: abre el <strong>Plan de 6 días</strong>, ve al día que toque y entra en
            sus flashcards desde ahí. Reserva 20 min al final del día para el <strong>Repaso diario</strong>.
            Cuando estés listo, prueba un <strong>Simulacro temático</strong> en voz alta. Tu progreso se
            guarda en este navegador.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/plan/"
              onClick={dismissWelcome}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              <CalendarDays size={14} aria-hidden /> Abrir Plan
              <ChevronRight size={14} aria-hidden />
            </Link>
            <button
              type="button"
              onClick={dismissWelcome}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-300"
            >
              Entendido
            </button>
          </div>
        </section>
      )}

      {/* Global progress */}
      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            <CheckCircle2 size={15} aria-hidden /> Progreso global
          </h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {hydrated ? `${totalKnown} / ${questions.length} conocidas · ${globalPct}%` : '…'}
          </span>
        </div>
        <ProgressBar
          value={totalKnown + totalReview + totalSkipped}
          max={questions.length}
          skipped={totalSkipped}
          label="Progreso global"
        />
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-400 dark:text-zinc-500">
          <span>{hydrated ? `${totalReview} marcadas para repasar` : ' '}</span>
          <ExportImport onImported={reload} />
        </div>
        {hydrated && (
          <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-ink-700">
            <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              ☁ Sincronización en nube
            </p>
            <CloudSync onRestored={reload} />
          </div>
        )}
      </section>

      {/* Tools — grouped */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Herramientas
        </h2>
        <div className="space-y-5">
          {TOOLS.map((group) => (
            <div key={group.section}>
              <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">{group.section}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.tools.map((t) => {
                  const Icon = t.icon;
                  return (
                    <Link
                      key={t.href}
                      href={t.href}
                      className={`group flex items-start gap-3 rounded-2xl border p-4 transition hover:-translate-y-px hover:shadow ${
                        t.accent
                          ? 'border-accent/40 bg-accent/5 hover:border-accent dark:bg-accent/10'
                          : 'border-zinc-200 bg-white hover:border-accent/60 dark:border-ink-700 dark:bg-ink-900'
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        t.accent ? 'bg-accent text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-ink-800 dark:text-zinc-300'
                      }`}>
                        <Icon size={18} aria-hidden />
                      </span>
                      <div className="flex-1">
                        <p className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-white">
                          {t.label}
                          {t.href === '/review/' && totalReview > 0 && (
                            <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                              {totalReview}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
