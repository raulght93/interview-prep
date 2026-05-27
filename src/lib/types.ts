export type Difficulty = 'easy' | 'medium' | 'hard';
export type CardStatus = 'new' | 'known' | 'review';
export type Risk = 'alto' | 'medio' | 'bajo';

export interface Question {
  id: string;
  topicId: string;
  question: string;
  answer: string; // Markdown permitido (negritas, código inline, listas)
  tags: string[];
  difficulty: Difficulty;
}

export interface Topic {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Riesgo en la entrevista según el diagnóstico — guía la priorización. */
  risk?: Risk;
}

export interface CardProgress {
  status: CardStatus;
  lastSeenAt: number; // timestamp
  timesSeen: number;
  timesKnown: number;
}

export interface Progress {
  [questionId: string]: CardProgress;
}

export interface Dataset {
  topics: Topic[];
  questions: Question[];
}
