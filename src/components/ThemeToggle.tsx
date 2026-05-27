'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { loadTheme, saveTheme, type Theme } from '@/lib/storage';

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = loadTheme();
    setTheme(t);
    apply(t);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    apply(next);
    saveTheme(next);
  }

  // Avoid hydration flash: render a stable button.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-pressed={theme === 'dark'}
      className="rounded-lg border border-zinc-300 p-2 text-zinc-600 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-300"
    >
      {mounted && theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
