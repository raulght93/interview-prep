'use client';

export default function ProgressBar({
  value,
  max,
  skipped = 0,
  label,
}: {
  value: number;
  max: number;
  skipped?: number;
  label?: string;
}) {
  const answered = max > 0 ? Math.min(100, Math.round(((value - skipped) / max) * 100)) : 0;
  const skippedPct =
    max > 0 ? Math.min(100 - answered, Math.round((skipped / max) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label ?? `${value} de ${max}`}
      className="w-full"
    >
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-ink-700">
        {/* answered portion */}
        <div
          className="h-full rounded-l-full bg-accent transition-[width] duration-300"
          style={{ width: `${answered}%`, borderRadius: skippedPct > 0 ? '9999px 0 0 9999px' : '9999px' }}
        />
        {/* skipped portion — muted with a stripe pattern */}
        {skippedPct > 0 && (
          <div
            className="h-full bg-zinc-400 opacity-60 transition-[width] duration-300 dark:bg-zinc-500"
            style={{
              width: `${skippedPct}%`,
              borderRadius: '0 9999px 9999px 0',
              backgroundImage:
                'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(255,255,255,0.35) 3px, rgba(255,255,255,0.35) 6px)',
            }}
          />
        )}
      </div>
    </div>
  );
}
