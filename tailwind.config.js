/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#121212',
        'dark-surface': '#1a1a1a',
        'dark-border': '#333333',
        'dark-text': '#e2e8f0',
        'dark-accent': '#10b981',
        'dark-accent-hover': '#059669',
        'dark-accent-glow': 'rgba(16, 185, 129, 0.2)',
        'dark-terminal': '#0f1419',
        'dark-code': '#1e293b',
      },
    },
  },
  plugins: [],
} 