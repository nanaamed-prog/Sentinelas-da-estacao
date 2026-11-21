import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        noite: { DEFAULT: '#111C29', 900: '#0B131D', 800: '#111C29', 700: '#1A2A3C', 600: '#24384F' },
        vinho: { DEFAULT: '#632B2A', 600: '#7A3634' },
        ouro: { DEFAULT: '#C58B42', 300: '#E2B97F', 600: '#A8732F' },
        pergaminho: '#F2E7D6',
        marfim: '#FFF9EF',
        tinta: '#302820',
        // tokens semânticos (mudam com o tema)
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '1.125rem' },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.08), 0 8px 24px -12px rgb(0 0 0 / 0.25)',
        glow: '0 0 0 1px rgb(197 139 66 / 0.35), 0 10px 30px -10px rgb(197 139 66 / 0.45)',
      },
      keyframes: {
        fadeUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        flicker: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.82' } },
      },
      animation: { 'fade-up': 'fadeUp .45s ease-out both', flicker: 'flicker 3.2s ease-in-out infinite' },
    },
  },
  plugins: [],
} satisfies Config;
