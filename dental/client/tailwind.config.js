/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Cormorant Garamond'", "'Sora'", "Georgia", "serif"],
      },
      colors: {
        primary: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bbdaff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a6e",
        },
        dental: {
          bg: "#f8fafc",
          sidebar: "#0f172a",
          card: "#ffffff",
          border: "#e2e8f0",
          muted: "#64748b",
        },
        clinic: {
          cream: "#FBF8F3",
          sand: "#F5EFE6",
          stone: "#EDE5D8",
          border: "#E2D9CC",
          accent: "#9A7B5C",
          accentLight: "#D4B896",
          ink: "#1E1A17",
          muted: "#8A7F72",
          teal: "#0D9488",
          coral: "#EA580C",
          rose: "#E11D48",
          violet: "#7C3AED",
          sky: "#0284C7",
          blue: "#2563EB",
          amber: "#D97706",
        },
      },
    },
  },
  plugins: [],
};
