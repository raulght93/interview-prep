'use client';

import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportProgress, importProgress } from '@/lib/storage';

export default function ExportImport({ onImported }: { onImported?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  function download() {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-prep-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importProgress(String(reader.result));
        setMsg('Progreso importado ✓');
        onImported?.();
      } catch {
        setMsg('Archivo inválido');
      }
      setTimeout(() => setMsg(''), 2500);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={download}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-300"
      >
        <Download size={15} aria-hidden /> Exportar
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-300"
      >
        <Upload size={15} aria-hidden /> Importar
      </button>
      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onFile} aria-hidden />
      {msg && <span className="text-xs text-zinc-500 dark:text-zinc-400">{msg}</span>}
    </div>
  );
}
