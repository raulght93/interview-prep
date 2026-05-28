'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import type { Components } from 'react-markdown';

function useDarkMode() {
  const [isDark, setIsDark] = useState(true); // app default is dark
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
        e.stopPropagation(); // don't flip the flashcard
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

function CodeBlock({ language, code, isDark }: { language: string | null; code: string; isDark: boolean }) {
  const isPlain = !language; // unlabeled blocks → ASCII art / plain text

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
        <pre className="overflow-x-auto bg-zinc-50 p-4 font-mono text-[0.8rem] leading-relaxed text-zinc-700 dark:bg-[#161616] dark:text-zinc-300">
          {code}
        </pre>
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
      <SyntaxHighlighter
        language={language}
        style={isDark ? vscDarkPlus : vs}
        customStyle={isDark ? darkCustomStyle : lightCustomStyle}
        showLineNumbers={false}
        wrapLongLines={false}
      >
        {code}
      </SyntaxHighlighter>
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
    // Tables (remark-gfm)
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
    // Pre is stripped so CodeBlock can render its own wrapper
    pre: ({ children }) => <>{children}</>,
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className ?? '');
      const language = match?.[1] ?? null;
      const code = String(children).replace(/\n$/, '');

      // Block code: has a language class, or contains newlines (fenced block without lang)
      if (language || code.includes('\n')) {
        return <CodeBlock language={language} code={code} isDark={isDark} />;
      }

      // Inline code
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
