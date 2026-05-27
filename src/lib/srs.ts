import type { Progress, Question } from './types';
import { getCard } from './storage';

/**
 * Minimal spaced-repetition ordering. Not Anki-grade — just a sensible sort:
 *  1. Cards never seen (status 'new', lastSeenAt 0) come first.
 *  2. Then cards marked 'review' (lowest priority weight => surfaced sooner),
 *     oldest lastSeenAt first.
 *  3. Then 'known' cards, oldest first.
 *
 * The weight encodes status priority; ties broken by how long ago it was seen.
 */
function statusWeight(status: string): number {
  switch (status) {
    case 'new':
      return 0;
    case 'review':
      return 1;
    case 'known':
      return 2;
    default:
      return 1;
  }
}

export function srsSort(questions: Question[], progress: Progress): Question[] {
  return [...questions].sort((a, b) => {
    const ca = getCard(progress, a.id);
    const cb = getCard(progress, b.id);
    const wa = statusWeight(ca.status);
    const wb = statusWeight(cb.status);
    if (wa !== wb) return wa - wb;
    // Within the same status: oldest seen first (lastSeenAt ascending).
    return ca.lastSeenAt - cb.lastSeenAt;
  });
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface TopicStats {
  total: number;
  known: number;
  review: number;
  newCount: number;
  knownPct: number;
}

export function topicStats(questions: Question[], progress: Progress): TopicStats {
  let known = 0;
  let review = 0;
  let newCount = 0;
  for (const q of questions) {
    const c = getCard(progress, q.id);
    if (c.status === 'known') known++;
    else if (c.status === 'review') review++;
    else newCount++;
  }
  const total = questions.length;
  return {
    total,
    known,
    review,
    newCount,
    knownPct: total ? Math.round((known / total) * 100) : 0,
  };
}
