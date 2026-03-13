/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Bitget Cyan Accent
        bitget: {
          cyan: '#00EBFF',
          'cyan-light': '#16E2F5',
          'cyan-dark': '#00D4E6',
        },
        // Vantix dark theme aliases
        vantix: {
          cyan: '#00EBFF',
          'cyan-light': '#16E2F5',
          'cyan-dark': '#00D4E6',
        },
        // Dark Mode Colors — Vantix Neo-Digital
        dark: {
          bg: '#080808',
          surface: '#3a3434',
          'surface-light': '#2e2929',
          border: '#554e4e',
          text: '#F5F5F0',
          'text-secondary': '#C0B8B8',
          obsidian: '#3a3434',
        },
        // Light Mode Colors
        light: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          text: '#1A1A1A',
          'text-secondary': '#64748B',
        },
        // Legacy colors for backward compatibility
        primary: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          500: '#00EBFF',
          600: '#00D4E6',
          700: '#00BCD4',
          900: '#3a3434',
        },
        secondary: {
          50: '#F8FAFC',
          100: '#E2E8F0',
          200: '#CBD5E1',
          500: '#64748B',
          700: '#475569',
          900: '#1E293B',
        },
        accent: '#00EBFF',
        danger: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'iridescent': 'linear-gradient(135deg, #FFC0CB 0%, #E6E6FA 50%, #B0E0E6 100%)',
        'iridescent-hover': 'linear-gradient(135deg, #B0E0E6 0%, #E6E6FA 50%, #FFC0CB 100%)',
      },
      transitionProperty: {
        'theme': 'background-color, border-color, color',
      },
      transitionDuration: {
        'theme': '300ms',
      },
    },
  },
  plugins: [],
};
