/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      colors: {
        ink:    { DEFAULT: '#0D0F14', 50: '#1a1d26', 100: '#12141b' },
        slate:  { DEFAULT: '#1E2130', light: '#252A3D', border: '#2E3347' },
        violet: { DEFAULT: '#7C6EF5', light: '#9D92F7', dark: '#5A4DE8', glow: '#7C6EF520' },
        cyan:   { DEFAULT: '#22D3EE', light: '#67E8F9', dark: '#0EA5E9', glow: '#22D3EE15' },
        rose:   { DEFAULT: '#F43F5E', light: '#FB7185', dark: '#E11D48', glow: '#F43F5E15' },
        amber:  { DEFAULT: '#F59E0B', light: '#FCD34D', dark: '#D97706', glow: '#F59E0B15' },
        emerald:{ DEFAULT: '#10B981', light: '#34D399', dark: '#059669', glow: '#10B98115' },
        ghost:  { DEFAULT: '#8892A4', light: '#A8B2C4', dark: '#636D7E' },
      },
      boxShadow: {
        'glow-violet': '0 0 30px rgba(124, 110, 245, 0.15)',
        'glow-cyan':   '0 0 30px rgba(34, 211, 238, 0.12)',
        'glow-rose':   '0 0 30px rgba(244, 63, 94, 0.15)',
        'card':        '0 4px 24px rgba(0,0,0,0.3)',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.45)',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'fade-in':    'fadeIn 0.3s ease forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-in':   'slideIn 0.4s ease forwards',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
