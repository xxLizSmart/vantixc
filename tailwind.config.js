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
        // Dark Mode Colors
        dark: {
          bg: '#000000',
          surface: '#121212',
          'surface-light': '#1E1E1E',
          border: '#2A2A2A',
          text: '#FFFFFF',
          'text-secondary': '#B0B0B0',
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
          900: '#1A1A1A',
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
