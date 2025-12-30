/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/index.html',
    './src/renderer/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0f7ff',
          100: '#b3e9ff',
          200: '#80daff',
          300: '#4dcbff',
          400: '#1abeff',
          500: '#00a8e6',
          600: '#0083b3',
          700: '#005e80',
          800: '#003a4d',
          900: '#00151a',
        },
        accent: {
          50: '#ffe0ff',
          100: '#ffb3ff',
          200: '#ff80ff',
          300: '#ff4dff',
          400: '#ff1aff',
          500: '#e600e6',
          600: '#b300b3',
          700: '#800080',
          800: '#4d004d',
          900: '#1a001a',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00d4ff 0%, #ff00ff 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(255, 0, 255, 0.1) 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
