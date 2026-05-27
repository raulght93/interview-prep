'use client';

import { useEffect } from 'react';

export type KeyMap = Record<string, (e: KeyboardEvent) => void>;

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  );
}

/**
 * Binds a keydown handler map. Keys are matched against e.key
 * (e.g. ' ' for space, 'ArrowRight', 'k', 'r'). Ignored while a
 * form field is focused so shortcuts don't hijack typing.
 */
export function useKeyboard(map: KeyMap, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    function onKey(e: KeyboardEvent) {
      if (isEditable(e.target)) return;
      const handler = map[e.key];
      if (handler) {
        handler(e);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [map, enabled]);
}
