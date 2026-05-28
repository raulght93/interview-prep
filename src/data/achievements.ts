// Logros desbloqueables — capa de gamificación.
// Cada logro tiene una condición evaluable sobre los stats del usuario.

import type { Progress } from '@/lib/types';
import { getCard } from '@/lib/storage';
import { questions } from '@/lib/data';

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  /** Texto de "Cómo desbloquearlo" si no lo tiene. */
  hint: string;
  /** Condición evaluada sobre los stats. */
  check: (stats: GameStats) => boolean;
  /** Si es secreto, no muestra hint hasta desbloquearlo. */
  secret?: boolean;
}

export interface GameStats {
  knownTotal: number;
  reviewTotal: number;
  skippedTotal: number;
  totalCards: number;
  topicsCompleted: number; // topics con 100% known
  streakDays: number;
  /** Logros ya desbloqueados (para auto-unlock encadenados si quisiéramos). */
  unlocked: string[];
}

export function computeStats(progress: Progress, streakDays: number, unlocked: string[]): GameStats {
  let known = 0;
  let review = 0;
  let skipped = 0;
  const byTopic = new Map<string, { total: number; known: number }>();

  for (const q of questions) {
    const c = getCard(progress, q.id);
    if (c.status === 'known') known++;
    else if (c.status === 'review') review++;
    else if (c.status === 'skipped') skipped++;
    const stat = byTopic.get(q.topicId) ?? { total: 0, known: 0 };
    stat.total++;
    if (c.status === 'known') stat.known++;
    byTopic.set(q.topicId, stat);
  }
  const topicsCompleted = Array.from(byTopic.values()).filter((s) => s.known === s.total).length;
  return {
    knownTotal: known,
    reviewTotal: review,
    skippedTotal: skipped,
    totalCards: questions.length,
    topicsCompleted,
    streakDays,
    unlocked,
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  // --- Onboarding ---
  {
    id: 'first-card',
    emoji: '🎉',
    title: 'Primer paso',
    desc: 'Marcaste tu primera card.',
    hint: 'Marca una card como "La sabía" o "Repasar".',
    check: (s) => s.knownTotal + s.reviewTotal + s.skippedTotal >= 1,
  },
  // --- Volumen ---
  {
    id: 'ten-known',
    emoji: '🌱',
    title: 'En marcha',
    desc: 'Tienes 10 cards conocidas.',
    hint: 'Domina 10 cards.',
    check: (s) => s.knownTotal >= 10,
  },
  {
    id: 'fifty-known',
    emoji: '📚',
    title: 'Estudiante aplicado',
    desc: '50 cards conocidas. Empiezas a notar el avance.',
    hint: 'Domina 50 cards.',
    check: (s) => s.knownTotal >= 50,
  },
  {
    id: 'hundred-known',
    emoji: '🎯',
    title: 'Centenario',
    desc: '100 cards conocidas. Ya tienes una base sólida.',
    hint: 'Domina 100 cards.',
    check: (s) => s.knownTotal >= 100,
  },
  {
    id: 'two-hundred-known',
    emoji: '🚀',
    title: 'Velocidad de crucero',
    desc: '200 cards conocidas. Estás listo.',
    hint: 'Domina 200 cards.',
    check: (s) => s.knownTotal >= 200,
  },
  {
    id: 'master',
    emoji: '🧙',
    title: 'Maestro',
    desc: 'Todas las cards conocidas. Eres una bestia.',
    hint: 'Domina TODAS las cards.',
    check: (s) => s.knownTotal === s.totalCards && s.totalCards > 0,
  },
  // --- Cobertura ---
  {
    id: 'first-topic-complete',
    emoji: '🥇',
    title: 'Tema completo',
    desc: 'Has completado un tema entero (todas conocidas).',
    hint: 'Domina todas las cards de algún tema.',
    check: (s) => s.topicsCompleted >= 1,
  },
  {
    id: 'half-topics',
    emoji: '🏅',
    title: 'A medio camino',
    desc: 'La mitad de los temas dominados.',
    hint: 'Completa la mitad de los temas.',
    check: (s) => s.topicsCompleted >= 11,
  },
  {
    id: 'all-topics',
    emoji: '🏆',
    title: 'Polímata',
    desc: 'TODOS los temas completos. Eres oficialmente peligroso.',
    hint: 'Completa todos los temas.',
    check: (s) => s.topicsCompleted >= 21,
  },
  // --- Streak ---
  {
    id: 'streak-3',
    emoji: '🔥',
    title: '3 días seguidos',
    desc: 'Constancia que se nota.',
    hint: 'Visita la app 3 días seguidos.',
    check: (s) => s.streakDays >= 3,
  },
  {
    id: 'streak-7',
    emoji: '🔥🔥',
    title: 'Una semana en racha',
    desc: '¡7 días seguidos! Empezar es difícil, mantenerlo es lo que cuenta.',
    hint: 'Visita la app 7 días seguidos.',
    check: (s) => s.streakDays >= 7,
  },
  {
    id: 'streak-14',
    emoji: '🔥🔥🔥',
    title: 'Maratón mental',
    desc: '14 días en racha. Probablemente sepas más que media oficina.',
    hint: 'Visita la app 14 días seguidos.',
    check: (s) => s.streakDays >= 14,
  },
  // --- Comportamiento ---
  {
    id: 'review-buster',
    emoji: '💪',
    title: 'Caza-repasos',
    desc: 'Cinco cards que estaban en repaso ahora las dominas.',
    hint: 'Convierte 5 cards de "repasar" a "la sabía".',
    check: (s) => s.knownTotal >= 5 && s.reviewTotal === 0,
  },
  {
    id: 'pragmatic',
    emoji: '⏭️',
    title: 'Pragmático',
    desc: 'Has saltado al menos una card. No todo merece tu tiempo, y lo sabes.',
    hint: 'Usa el botón "Saltar" alguna vez.',
    check: (s) => s.skippedTotal >= 1,
  },
  // --- Easter eggs ---
  {
    id: 'comeback',
    emoji: '🎬',
    title: 'Aquí seguimos',
    desc: 'Has vuelto a la app tras un parón. Mejor recoger el hilo tarde que nunca.',
    hint: '(Secreto)',
    secret: true,
    check: (s) => s.streakDays === 1 && s.knownTotal >= 20,  // racha rota y vuelta
  },
];

export function unlockedAchievements(stats: GameStats): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.check(stats));
}

/** Devuelve los nuevos logros (que no estaban en unlocked previo). */
export function newlyUnlocked(stats: GameStats, previous: string[]): Achievement[] {
  const prev = new Set(previous);
  return unlockedAchievements(stats).filter((a) => !prev.has(a.id));
}
