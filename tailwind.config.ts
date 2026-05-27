import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // App surface palette — near-black background, off-white text.
        ink: {
          950: '#0a0a0a',
          900: '#121212',
          800: '#1a1a1a',
          700: '#262626',
          600: '#333333',
        },
        accent: {
          DEFAULT: '#7c8cff', // blue/purple
          fg: '#a78bfa',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      maxWidth: {
        card: '700px',
      },
      keyframes: {
        'fade-scale': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-scale': 'fade-scale 180ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
