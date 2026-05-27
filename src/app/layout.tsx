import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Interview Prep — Arquitectura & Backend',
  description:
    'Flashcards y quiz para preparar entrevistas técnicas: Spring Boot, Java, Kafka, Redis, React, DDD, SQL y más. Funciona offline.',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

// Set the theme class before first paint to avoid a flash of the wrong theme.
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('interview-prep-theme-v1');
    var theme = t === 'light' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
