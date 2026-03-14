import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        stone: {
          50: '#FAF8F5',
          100: '#F5F0E8',
          200: '#EDE5D8',
          300: '#DDD0C0',
          400: '#C4B5A0',
          500: '#A89880',
          600: '#8C7C68',
          700: '#6B5F50',
          800: '#3D342B',
          900: '#1C1917',
        },
        terra: {
          DEFAULT: '#C4715A',
          light: '#D4896F',
          dark: '#A85A45',
        },
        sage: {
          DEFAULT: '#8FA892',
          light: '#A8BFA9',
          dark: '#6E8C72',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'breathe': 'breathe 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
      },
      boxShadow: {
        'warm': '0 4px 24px rgba(28, 25, 23, 0.08)',
        'warm-lg': '0 8px 40px rgba(28, 25, 23, 0.12)',
        'terra': '0 4px 20px rgba(196, 113, 90, 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
