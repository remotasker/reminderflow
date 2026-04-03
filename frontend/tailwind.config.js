/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Critical: This allows 'next-themes' to switch modes using the 'dark' class
  darkMode: 'class', 
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 2. This sets Poppins as the default font for 'font-sans'
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        // Matching the deep navy-black from your screenshot
        slate: {
          950: '#020617',
        }
      },
    },
  },
  plugins: [],
};
