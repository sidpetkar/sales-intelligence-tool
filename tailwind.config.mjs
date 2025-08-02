/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Keep class-based dark mode
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'dark',
    'theme-dark',
    'dark:bg-[#161616]',
    'dark:text-[#F9FAFB]',
    'dark:bg-[#292929]',
    'dark:bg-[#1E1E1E]',
    'dark:border-[#2F2F2E]',
    'dark:border-transparent'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      // You can add custom colors or fonts here
    },
  },
  plugins: [],
}; 