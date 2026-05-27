'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CardStatus, Progress } from './types';
import { loadProgress, markCard, saveProgress, touchCard } from './storage';

/**
 * Single source of truth for card progress in the client.
 * Hydrates from localStorage after mount (avoids SSR/export mismatch),
 * and persists on every change.
 */
export function useProgress() {
  const [progress, setProgress] = useState<Progress>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveProgress(progress);
  }, [progress, hydrated]);

  const mark = useCallback((id: string, status: CardStatus) => {
    setProgress((p) => markCard(p, id, status));
  }, []);

  const touch = useCallback((id: string) => {
    setProgress((p) => touchCard(p, id));
  }, []);

  const reload = useCallback(() => {
    setProgress(loadProgress());
  }, []);

  return { progress, hydrated, mark, touch, reload, setProgress };
}
