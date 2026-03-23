import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          2: '#f5f4f2',
          3: '#fafaf9',
        },
        border: {
          DEFAULT: '#e8e6e1',
          2: '#d4d0c8',
        },
        ink: {
          DEFAULT: '#1a1917',
          2: '#6b6860',
          3: '#a8a49d',
        },
      },
    },
  },
  plugins: [],
}

export default config
