import raw from '@/data/questions.json';
import type { Dataset, Question, Risk, Topic } from './types';

const dataset = raw as Dataset;

export const topics: Topic[] = dataset.topics;
export const questions: Question[] = dataset.questions;

/** Higher number = study sooner. */
export function riskRank(risk?: Risk): number {
  switch (risk) {
    case 'alto':
      return 3;
    case 'medio':
      return 2;
    case 'bajo':
      return 1;
    default:
      return 0;
  }
}

/**
 * Topics ordered by interview priority: highest risk first; within the same
 * risk, the ones you know least come first (lowest known %).
 */
export function topicsByPriority(knownPctById: Record<string, number>): Topic[] {
  return [...topics].sort((a, b) => {
    const r = riskRank(b.risk) - riskRank(a.risk);
    if (r !== 0) return r;
    return (knownPctById[a.id] ?? 0) - (knownPctById[b.id] ?? 0);
  });
}

export function getTopic(id: string): Topic | undefined {
  return topics.find((t) => t.id === id);
}

export function questionsByTopic(topicId: string): Question[] {
  return questions.filter((q) => q.topicId === topicId);
}

export function getQuestion(id: string): Question | undefined {
  return questions.find((q) => q.id === id);
}

export function topicCount(topicId: string): number {
  return questionsByTopic(topicId).length;
}

/** Full-text search across question, answer and tags. */
export function searchQuestions(term: string): Question[] {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  return questions.filter(
    (item) =>
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q)),
  );
}
