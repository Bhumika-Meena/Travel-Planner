/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          dark: "#1e40af",
        },
        secondary: "#1e40af",
        accent: "#3b82f6",
      },
      boxShadow: {
        '2xs': "0 1px 1px 0 rgba(15, 23, 42, 0.03)",
        xs: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        subtle: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px 0 rgba(15, 23, 42, 0.03)",
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px -4px rgba(15, 23, 42, 0.06)",
        elevated: "0 12px 32px -8px rgba(15, 23, 42, 0.10), 0 4px 8px -4px rgba(15, 23, 42, 0.04)",
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.22s ease-out',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
}; 