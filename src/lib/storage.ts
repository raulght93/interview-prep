import type { CardProgress, CardStatus, Progress } from './types';

const KEY = 'interview-prep-progress-v1';
const THEME_KEY = 'interview-prep-theme-v1';
const PLAN_KEY = 'interview-prep-plan-v1';

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

// ---- Export / Import ----

export function exportProgress(): string {
  return JSON.stringify(loadProgress(), null, 2);
}

export function importProgress(json: string): Progress {
  const parsed = JSON.parse(json) as Progress;
  saveProgress(parsed);
  return parsed;
}
