/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#ECECEB',
          plate: '#F5F5F3',
          recessed: '#E6E6E3',
          border: '#D5D5D0',
        },
        rocker: {
          orange: '#FF5500',
          darkOrange: '#CC4400',
          blue: '#2563EB',
          green: '#10B981',
          amber: '#F59E0B',
          bone: '#F0F0ED',
        },
        signal: {
          gray: '#888884',
          charcoal: '#1A1A18',
        },
        led: {
          red: '#FF453A',
          amber: '#FF9F0A',
          green: '#30D158',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          'var(--font-serif)',
          '"Cormorant Garamond"',
          'Georgia',
          'Cambria',
          'serif',
        ],
        display: [
          'var(--font-display)',
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono)',
          '"JetBrains Mono"',
          '"Geist Mono"',
          'ui-monospace',
          'monospace',
        ],
      },
      transitionTimingFunction: {
        'studio-ease': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
