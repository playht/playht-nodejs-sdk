import formsPlugin from '@tailwindcss/forms';
import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,tsx,jsx}'],
  plugins: [formsPlugin],
  darkMode: 'class',
  theme: {
    colors: {
      ...colors,
      'primary-50': '#A2B9E9',
      'primary-100': '#8FABE4',
      'primary-200': '#7D9DE0',
      'primary-300': '#6A8FDB',
      'primary-400': '#5881D7',
      primary: '#5344F9',
      'primary-500': '#4573D2',
      'primary-600': '#3E68BD',
      'primary-700': '#375CA8',
      'primary-800': '#305193',
      'primary-900': '#29457E',
      'primary-950': '#1b1d29',
    },
  },
};
