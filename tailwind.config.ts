import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dc: {
          rainbowRed: '#FF5C7A',
          rainbowOrange: '#FF9A4D',
          rainbowYellow: '#FFD34D',
          rainbowGreen: '#5BD98A',
          rainbowBlue: '#4DB8FF',
          rainbowPink: '#FF8FD1',
          rainbowPurple: '#B98CFF',
          ink: '#3A2E4D',
          cloud: '#FFFFFF',
          fog: '#F3EEFF',
          stone: '#8A8296',
        },
      },
      fontFamily: {
        display: ['"Baloo 2"', '"Trebuchet MS"', 'system-ui', 'sans-serif'],
        body: ['"Nunito"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.5rem',
        blob: '2.5rem',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(58, 46, 77, 0.15)',
        pop: '0 4px 0 rgba(58, 46, 77, 0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config;
