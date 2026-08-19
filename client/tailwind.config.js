/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155'
        },
        emerald: {
          500: '#10B981',
          600: '#059669',
          700: '#047857'
        },
        saffron: {
          500: '#F59E0B',
          600: '#D97706'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans"', 'sans-serif']
      }
    }
  },
  plugins: []
};
