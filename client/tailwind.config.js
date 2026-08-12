/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F772D', hover: '#3F6025' },
        lightgreen: '#F2F7EE',
        page: '#F7F8F5',
        border: '#E7E5E4',
        text: {
          main: '#1C1917',
          secondary: '#57534E',
          muted: '#78716C',
        },
        success: { DEFAULT: '#16A34A', bg: '#F0FDF4' },
        warning: { DEFAULT: '#F59E0B', bg: '#FFFBEB' },
        error: { DEFAULT: '#DC2626', bg: '#FEF2F2' },
        info: { DEFAULT: '#2563EB', bg: '#EFF6FF' },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'Arial', 'sans-serif'],
      },
      spacing: {
        '4.5': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(28, 25, 23, 0.04), 0 1px 3px 0 rgba(28, 25, 23, 0.06)',
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};
