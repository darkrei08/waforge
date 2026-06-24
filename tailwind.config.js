/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.vue',
    './components/**/*.vue',
    './layouts/**/*.vue',
    './app.vue',
    './error.vue',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Surface hierarchy
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          dim: "rgb(var(--surface-dim) / <alpha-value>)",
          bright: "rgb(var(--surface-bright) / <alpha-value>)",
          variant: "rgb(var(--surface-variant) / <alpha-value>)",
        },
        "surface-container": {
          lowest: "rgb(var(--surface-container-lowest) / <alpha-value>)",
          low: "rgb(var(--surface-container-low) / <alpha-value>)",
          DEFAULT: "rgb(var(--surface-container) / <alpha-value>)",
          high: "rgb(var(--surface-container-high) / <alpha-value>)",
          highest: "rgb(var(--surface-container-highest) / <alpha-value>)",
        },
        "on-surface": {
          DEFAULT: "rgb(var(--on-surface) / <alpha-value>)",
          variant: "rgb(var(--on-surface-variant) / <alpha-value>)",
        },
        // Primary (WhatsApp Green)
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          container: "rgb(var(--primary-container) / <alpha-value>)",
          fixed: "rgb(var(--primary-fixed) / <alpha-value>)",
          "fixed-dim": "rgb(var(--primary-fixed-dim) / <alpha-value>)",
        },
        "on-primary": {
          DEFAULT: "rgb(var(--on-primary) / <alpha-value>)",
          container: "rgb(var(--on-primary-container) / <alpha-value>)",
        },
        // Secondary (Blue accents)
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          container: "rgb(var(--secondary-container) / <alpha-value>)",
          fixed: "rgb(var(--secondary-fixed) / <alpha-value>)",
          "fixed-dim": "rgb(var(--secondary-fixed-dim) / <alpha-value>)",
        },
        // Tertiary (Emerald accents)
        tertiary: {
          DEFAULT: "rgb(var(--tertiary) / <alpha-value>)",
          container: "rgb(var(--tertiary-container) / <alpha-value>)",
        },
        // Functional
        error: {
          DEFAULT: "rgb(var(--error) / <alpha-value>)",
          container: "rgb(var(--error-container) / <alpha-value>)",
        },
        outline: {
          DEFAULT: "#869584",
          variant: "#3c4a3d",
        },
        // Legacy WhatsApp shortcuts
        whatsapp: {
          DEFAULT: "#25D366",
          dark: "#128C7E",
          light: "#DCF8C6",
          bg: "#ECE5DD",
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.25rem",
        xl: "1.5rem",
      },
      spacing: {
        "sidebar": "280px",
      },
      backdropBlur: {
        xs: "2px",
        glass: "20px",
        "glass-heavy": "40px",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        "slide-in": {
          from: { transform: "translateY(-10px)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(37,211,102,0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(37,211,102,0.6)" },
        },
        scan: {
          "0%, 100%": { top: "0" },
          "50%": { top: "100%" },
        },
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "scan": "scan 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
