import type { CardProgress, CardStatus, Progress } from './types';

const KEY = 'interview-prep-progress-v1';
const THEME_KEY = 'interview-prep-theme-v1';
const PLAN_KEY = 'interview-prep-plan-v1';
const STREAK_KEY = 'interview-prep-streak-v1';
const ACH_KEY = 'interview-prep-achievements-v1';
const MCQ_FAILED_KEY = 'interview-prep-mcq-failed-v1';
const MCQ_SKIPPED_KEY = 'interview-prep-mcq-skipped-v1';

const isBrowser = typeof window !== 'undefined';

export function loadProgress(): Progress {
  if (!isBrowser) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Progress) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: Progress): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // quota / private mode — ignore silently.
  }
}

function blank(): CardProgress {
  return { status: 'new', lastSeenAt: 0, timesSeen: 0, timesKnown: 0 };
}

export function getCard(progress: Progress, id: string): CardProgress {
  return progress[id] ?? blank();
}

/** Returns a NEW progress object with the card updated (immutable update). */
export function markCard(progress: Progress, id: string, status: CardStatus): Progress {
  const prev = getCard(progress, id);
  const next: CardProgress = {
    status,
    lastSeenAt: Date.now(),
    timesSeen: prev.timesSeen + 1,
    timesKnown: prev.timesKnown + (status === 'known' ? 1 : 0),
  };
  return { ...progress, [id]: next };
}

/** Records that a card was seen without changing its known/review status. */
export function touchCard(progress: Progress, id: string): Progress {
  const prev = getCard(progress, id);
  return {
    ...progress,
    [id]: { ...prev, lastSeenAt: Date.now(), timesSeen: prev.timesSeen + 1 },
  };
}

// ---- Theme ----

export type Theme = 'dark' | 'light';

export function loadTheme(): Theme {
  if (!isBrowser) return 'dark';
  const v = window.localStorage.getItem(THEME_KEY);
  return v === 'light' ? 'light' : 'dark'; // dark por defecto
}

export function saveTheme(theme: Theme): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

// ---- Streak (racha de días consecutivos) ----

interface StreakState {
  lastDate: string; // YYYY-MM-DD
  days: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/** Llama esto al entrar en la home — actualiza la racha y la devuelve. */
export function tickStreak(): number {
  if (!isBrowser) return 0;
  const today = todayStr();
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    const prev: StreakState = raw ? JSON.parse(raw) : { lastDate: '', days: 0 };

    if (prev.lastDate === today) return prev.days; // ya contado hoy

    const gap = prev.lastDate ? daysBetween(prev.lastDate, today) : 999;
    let days: number;
    if (gap === 1) days = prev.days + 1; // día siguiente → +1
    else days = 1; // primera visita o se rompió la racha → 1

    window.localStorage.setItem(STREAK_KEY, JSON.stringify({ lastDate: today, days }));
    return days;
  } catch {
    return 0;
  }
}

export function readStreak(): number {
  if (!isBrowser) return 0;
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    const s: StreakState = JSON.parse(raw);
    // Si ha pasado más de 1 día, la racha está rota — se reseteará al próximo tickStreak.
    const gap = daysBetween(s.lastDate, todayStr());
    if (gap > 1) return 0;
    return s.days;
  } catch {
    return 0;
  }
}

// ---- Achievements desbloqueados ----

export function loadUnlocked(): string[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(ACH_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveUnlocked(ids: string[]): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(ACH_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

// ---- Study plan (días completados) ----

export function loadPlanDone(): number[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(PLAN_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function savePlanDone(days: number[]): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(PLAN_KEY, JSON.stringify(days));
  } catch {
    /* ignore */
  }
}

// ---- MCQ failed / skipped (persist across sessions) ----

export function loadMcqFailed(): string[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(MCQ_FAILED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

export function saveMcqFailed(ids: string[]): void {
  if (!isBrowser) return;
  try { window.localStorage.setItem(MCQ_FAILED_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

export function loadMcqSkipped(): string[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(MCQ_SKIPPED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

export function saveMcqSkipped(ids: string[]): void {
  if (!isBrowser) return;
  try { window.localStorage.setItem(MCQ_SKIPPED_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

// ---- Cloud sync: collect / restore all state ----

export interface AllProgress {
  progress: Progress;
  mcqFailed: string[];
  mcqSkipped: string[];
  streak: unknown;
  achievements: string[];
  planDone: number[];
}

/** Collects all syncable state from localStorage into one object. */
export function collectAllProgress(): AllProgress {
  if (!isBrowser) return { progress: {}, mcqFailed: [], mcqSkipped: [], streak: null, achievements: [], planDone: [] };
  let streak: unknown = null;
  try { streak = JSON.parse(window.localStorage.getItem(STREAK_KEY) ?? 'null'); } catch { /* ignore */ }
  return {
    progress: loadProgress(),
    mcqFailed: loadMcqFailed(),
    mcqSkipped: loadMcqSkipped(),
    streak,
    achievements: loadUnlocked(),
    planDone: loadPlanDone(),
  };
}

/** Restores all syncable state from a cloud snapshot. */
export function restoreAllProgress(data: Partial<AllProgress>): void {
  if (!isBrowser) return;
  try {
    if (data.progress) saveProgress(data.progress);
    if (data.mcqFailed) saveMcqFailed(data.mcqFailed);
    if (data.mcqSkipped) saveMcqSkipped(data.mcqSkipped);
    if (data.streak) window.localStorage.setItem(STREAK_KEY, JSON.stringify(data.streak));
    if (data.achievements) saveUnlocked(data.achievements);
    if (data.planDone) savePlanDone(data.planDone);
  } catch { /* ignore */ }
}

// ---- Export / Import ----

export function exportProgress(): string {
  return JSON.stringify(loadProgress(), null, 2);
}

export function importProgress(json: string): Progress {
  const parsed = JSON.parse(json) as Progress;
  saveProgress(parsed);
  return parsed;
}
