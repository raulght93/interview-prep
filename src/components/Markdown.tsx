'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

// Styles the loose Markdown used in answers: bold, inline code, lists,
// and fenced code blocks (with horizontal scroll, no syntax theme dependency).
const components: Components = {
  p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-zinc-900 dark:text-white">{children}</strong>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} className="text-accent underline underline-offset-2" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  code({ className, children, ...props }) {
    const isBlock = /language-/.test(className ?? '');
    if (isBlock) {
      return (
        <code className={`${className ?? ''} font-mono text-sm`} {...props}>
          {children}
        </code>
      );
    }
    // Inline code.
    return (
      <code
        className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-sm leading-relaxed dark:bg-zinc-900 last:mb-0">
      {children}
    </pre>
  ),
};

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[0.975rem] text-zinc-700 dark:text-zinc-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
