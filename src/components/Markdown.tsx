'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import type { Components } from 'react-markdown';

function useDarkMode() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      aria-label={copied ? 'Copiado' : 'Copiar código'}
      className="flex items-center gap-1 rounded px-1.5 py-1 text-xs transition hover:bg-black/10 dark:hover:bg-white/10"
    >
      {copied
        ? <Check size={12} className="text-emerald-500" />
        : <Copy size={12} className="text-zinc-400 dark:text-zinc-500" />}
      <span className={copied ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-500'}>
        {copied ? 'Copiado' : 'Copiar'}
      </span>
    </button>
  );
}

/**
 * Wrapper that detects horizontal overflow and shows a gradient + scroll badge.
 * Works for both <pre> and the SyntaxHighlighter div.
 */
function ScrollHint({
  children,
  bgFrom,
}: {
  children: React.ReactNode;
  bgFrom: string; // tailwind class for the gradient 'from' color, e.g. 'from-zinc-50'
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // The actual scrollable child (pre or the SyntaxHighlighter div)
    const scrollEl = wrap.firstElementChild as HTMLElement | null;
    if (!scrollEl) return;

    const check = () => {
      const has = scrollEl.scrollWidth > scrollEl.clientWidth + 2;
      setOverflows(has);
      setAtEnd(!has || scrollEl.scrollLeft + scrollEl.clientWidth >= scrollEl.scrollWidth - 4);
    };

    check();
    const ro = new ResizeObserver(check);
    ro.observe(scrollEl);
    scrollEl.addEventListener('scroll', check, { passive: true });
    return () => {
      ro.disconnect();
      scrollEl.removeEventListener('scroll', check);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      {children}
      {/* Right-edge gradient fade */}
      {overflows && !atEnd && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l ${bgFrom} to-transparent`}
        />
      )}
      {/* Scroll hint badge */}
      {overflows && (
        <div
          aria-hidden
          className="absolute bottom-1.5 right-2 select-none rounded bg-black/10 px-1.5 py-0.5 font-mono text-[9px] leading-none text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
          style={{ opacity: atEnd ? 0.25 : 0.75, transition: 'opacity 0.2s' }}
        >
          ← desliza →
        </div>
      )}
    </div>
  );
}

function CodeBlock({ language, code, isDark }: { language: string | null; code: string; isDark: boolean }) {
  const isPlain = !language;

  const darkCustomStyle = {
    margin: 0,
    padding: '0.9rem 1rem',
    fontSize: '0.8125rem',
    lineHeight: '1.65',
    background: '#161616',
    borderRadius: 0,
  };

  const lightCustomStyle = {
    margin: 0,
    padding: '0.9rem 1rem',
    fontSize: '0.8125rem',
    lineHeight: '1.65',
    background: '#f8f8f8',
    borderRadius: 0,
  };

  if (isPlain) {
    return (
      <div className="group relative mb-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700/60 last:mb-0">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-3 py-1 dark:border-zinc-700/60 dark:bg-ink-800">
          <span className="font-mono text-[0.68rem] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
            diagrama
          </span>
          <CopyButton code={code} />
        </div>
        <ScrollHint bgFrom={isDark ? 'from-[#161616]' : 'from-zinc-50'}>
          <pre className="overflow-x-auto bg-zinc-50 p-3 font-mono text-[0.7rem] leading-relaxed text-zinc-700 sm:p-4 sm:text-[0.8rem] dark:bg-[#161616] dark:text-zinc-300">
            {code}
          </pre>
        </ScrollHint>
      </div>
    );
  }

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700/60 last:mb-0">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-3 py-1 dark:border-zinc-700/60 dark:bg-ink-800">
        <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-accent/80">
          {language}
        </span>
        <CopyButton code={code} />
      </div>
      <ScrollHint bgFrom={isDark ? 'from-[#1e1e1e]' : 'from-[#f8f8f8]'}>
        <SyntaxHighlighter
          language={language}
          style={isDark ? vscDarkPlus : vs}
          customStyle={isDark ? darkCustomStyle : lightCustomStyle}
          showLineNumbers={false}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </ScrollHint>
    </div>
  );
}

export default function Markdown({ children }: { children: string }) {
  const isDark = useDarkMode();

  const components: Components = {
    p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
    strong: ({ children }) => (
      <strong className="font-semibold text-zinc-900 dark:text-white">{children}</strong>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    a: ({ children, href }) => (
      <a
        href={href}
        className="text-accent underline underline-offset-2"
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    ),
    hr: () => <hr className="my-4 border-zinc-200 dark:border-zinc-700" />,
    table: ({ children }) => (
      <div className="mb-3 overflow-x-auto last:mb-0">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-zinc-300 bg-zinc-100 px-3 py-2 text-left font-semibold dark:border-zinc-700 dark:bg-ink-800">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-zinc-300 px-3 py-2 dark:border-zinc-700">{children}</td>
    ),
    pre: ({ children }) => <>{children}</>,
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className ?? '');
      const language = match?.[1] ?? null;
      const code = String(children).replace(/\n$/, '');

      if (language || code.includes('\n')) {
        return <CodeBlock language={language} code={code} isDark={isDark} />;
      }

      return (
        <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
          {children}
        </code>
      );
    },
  };

  return (
    <div className="text-[0.975rem] text-zinc-700 dark:text-zinc-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
