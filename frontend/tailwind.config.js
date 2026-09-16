/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        success: { DEFAULT: '#10B981', bg: '#ECFDF5', text: '#047857' },
        warning: { DEFAULT: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
        danger: { DEFAULT: '#EF4444', bg: '#FEF2F2', text: '#B91C1C' },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 4px 12px -2px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};
