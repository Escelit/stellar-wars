/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cosmic: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#5c7cfa',
          600: '#4c6ef5',
          700: '#4263eb',
          800: '#3b5bdb',
          900: '#364fc7',
          950: '#1e2a6b',
        },
        imperial: {
          50: '#fff0f0',
          100: '#ffdbdb',
          200: '#ffb8b8',
          300: '#ff8a8a',
          400: '#ff4d4d',
          500: '#e03131',
          600: '#c92a2a',
          700: '#a61e1e',
          800: '#871414',
          900: '#6b0f0f',
          950: '#3b0606',
        },
        stellar: {
          50: '#f4f6fb',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#a0aec0',
          400: '#718096',
          500: '#4a5568',
          600: '#2d3748',
          700: '#1a202c',
          800: '#171923',
          900: '#0f111a',
          950: '#07080d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
