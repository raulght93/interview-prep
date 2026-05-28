'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudDownload, CloudUpload, Copy, Check, RefreshCw, Pencil, X } from 'lucide-react';
import { collectAllProgress, restoreAllProgress } from '@/lib/storage';

const SYNC_KEY_LS = 'interview-prep-sync-key';

function rand8(): string {
  return Math.random().toString(36).slice(2, 10).toLowerCase();
}

function getSyncKey(): string {
  if (typeof window === 'undefined') return '';
  let key = window.localStorage.getItem(SYNC_KEY_LS);
  if (!key) {
    key = rand8();
    window.localStorage.setItem(SYNC_KEY_LS, key);
  }
  return key;
}

type Status = { ok: boolean; msg: string } | null;

export default function CloudSync({ onRestored }: { onRestored?: () => void }) {
  const [syncKey, setSyncKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [editingKey, setEditingKey] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSyncKey(getSyncKey());
  }, []);

  function clearStatus() {
    setStatus(null);
  }

  async function save() {
    setSaving(true);
    clearStatus();
    try {
      const key = getSyncKey();
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data: collectAllProgress() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const { savedAt } = (await res.json()) as { savedAt: string };
      setStatus({ ok: true, msg: `Guardado a las ${new Date(savedAt).toLocaleTimeString()}` });
    } catch (e) {
      setStatus({ ok: false, msg: e instanceof Error ? e.message : 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  }

  async function restore() {
    setLoading(true);
    clearStatus();
    try {
      const key = getSyncKey();
      const res = await fetch(`/api/progress?key=${encodeURIComponent(key)}`);
      if (res.status === 404) {
        setStatus({ ok: false, msg: 'No hay copia guardada para esta clave.' });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data, savedAt } = (await res.json()) as { data: Parameters<typeof restoreAllProgress>[0]; savedAt: string };
      restoreAllProgress(data);
      onRestored?.();
      setStatus({ ok: true, msg: `Restaurado (copia del ${new Date(savedAt).toLocaleDateString()})` });
    } catch (e) {
      setStatus({ ok: false, msg: e instanceof Error ? e.message : 'Error al restaurar' });
    } finally {
      setLoading(false);
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(syncKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function applyDraftKey() {
    const k = draftKey.trim().toLowerCase();
    if (!/^[a-z0-9]{6,32}$/.test(k)) {
      setStatus({ ok: false, msg: 'La clave debe tener entre 6 y 32 caracteres (a-z, 0-9).' });
      return;
    }
    window.localStorage.setItem(SYNC_KEY_LS, k);
    setSyncKey(k);
    setEditingKey(false);
    setDraftKey('');
    setStatus({ ok: true, msg: 'Clave actualizada. Ahora puedes restaurar el progreso de ese dispositivo.' });
  }

  return (
    <div>
      {/* Trigger row */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          title="Guardar todo el progreso en la nube (Cloudflare KV)"
          className="flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-600 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-300 dark:hover:border-accent dark:hover:text-accent"
        >
          {saving
            ? <RefreshCw size={12} className="animate-spin" aria-hidden />
            : <CloudUpload size={12} aria-hidden />}
          Guardar
        </button>

        <button
          type="button"
          onClick={restore}
          disabled={loading}
          title="Restaurar progreso desde la nube"
          className="flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-600 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-300 dark:hover:border-accent dark:hover:text-accent"
        >
          {loading
            ? <RefreshCw size={12} className="animate-spin" aria-hidden />
            : <CloudDownload size={12} aria-hidden />}
          Restaurar
        </button>

        <button
          type="button"
          onClick={() => { setShowPanel((v) => !v); clearStatus(); }}
          title="Ver / cambiar clave de sincronización"
          className="flex items-center gap-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs text-zinc-500 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-400"
        >
          <Cloud size={12} aria-hidden />
          clave
        </button>
      </div>

      {/* Status */}
      {status && (
        <p className={`mt-1.5 text-xs ${status.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {status.msg}
        </p>
      )}

      {/* Sync key panel */}
      {showPanel && (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-ink-700 dark:bg-ink-800">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[0.7rem] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Clave de sincronización
            </p>
            <button
              type="button"
              onClick={() => setShowPanel(false)}
              className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              aria-label="Cerrar"
            >
              <X size={12} aria-hidden />
            </button>
          </div>

          {!editingKey ? (
            <>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded border border-zinc-200 bg-white px-3 py-1.5 font-mono text-sm tracking-widest text-zinc-900 dark:border-ink-600 dark:bg-ink-900 dark:text-zinc-100">
                  {syncKey}
                </code>
                <button
                  type="button"
                  onClick={copyKey}
                  title="Copiar clave"
                  className="rounded-lg border border-zinc-300 p-1.5 text-zinc-500 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-400"
                  aria-label={copied ? 'Copiada' : 'Copiar clave'}
                >
                  {copied ? <Check size={13} className="text-emerald-500" aria-hidden /> : <Copy size={13} aria-hidden />}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingKey(true); setDraftKey(''); }}
                  title="Cambiar clave"
                  className="rounded-lg border border-zinc-300 p-1.5 text-zinc-500 transition hover:border-accent hover:text-accent dark:border-ink-600 dark:text-zinc-400"
                  aria-label="Cambiar clave"
                >
                  <Pencil size={13} aria-hidden />
                </button>
              </div>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Copia esta clave en otro dispositivo y pulsa <strong>Restaurar</strong> para sincronizar tu progreso. Caduca a los 90 días sin actividad.
              </p>
            </>
          ) : (
            <>
              <p className="mb-2 text-[0.72rem] text-zinc-500 dark:text-zinc-400">
                Escribe la clave de otro dispositivo para restaurar desde allí, o usa la que tienes.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyDraftKey()}
                  placeholder={syncKey}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-mono text-sm text-zinc-900 focus:border-accent focus:outline-none dark:border-ink-600 dark:bg-ink-900 dark:text-zinc-100"
                  aria-label="Nueva clave de sincronización"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={applyDraftKey}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingKey(false)}
                  className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs text-zinc-500 transition hover:border-zinc-400 dark:border-ink-600"
                  aria-label="Cancelar"
                >
                  <X size={13} aria-hidden />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
