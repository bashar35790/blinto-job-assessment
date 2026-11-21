import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mcu: {
          dark: '#0B0F19',
          card: '#131B2E',
          surface: '#1E293B',
          border: '#334155',
        },
        stark: {
          cyan: '#00F0FF',
          dark: '#00B8D4',
          glow: 'rgba(0, 240, 255, 0.25)',
        },
        marvel: {
          red: '#E62429',
          crimson: '#B91C1C',
          dark: '#7F1D1D',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
