/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Party colors
        'unp': '#660000',
        'slfp': '#5D0E41',
        'jvp': '#2E0854',
        'tna': '#36454F',
        'itak': '#023020',
        'epdp': '#000435',
        'actc': '#4B0000',
        'mna': '#7F6F4D',
        'nc': '#040720',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
};