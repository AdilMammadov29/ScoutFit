/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        // Sıcak Koyu ve Krem Açık Zeminler
        paper: {
          DEFAULT: "#f6f3ec", // Açık tema zemini
          dark: "#1a1917",    // Koyu tema zemini
        },
        surface: {
          DEFAULT: "#fbf9f4", // Açık tema kart yüzeyi
          dark: "#242220",    // Koyu tema kart yüzeyi
        },
        ink: {
          DEFAULT: "#2a2a26", // Açık tema ana yazı
          dark: "#e8e4dc",    // Koyu tema ana yazı
        },
        muted: {
          DEFAULT: "#787368", // Açık tema yardımcı gri
          dark: "#a8a398",    // Koyu tema yardımcı gri
        },
        line: {
          DEFAULT: "#ebe6dc", // Açık tema ince kenarlık
          dark: "#32302c",    // Koyu tema ince kenarlık
        },
        // Vurgu & Durum Tonları
        pine: {
          DEFAULT: "#2d5a43", // Doğal çam yeşili
          dark: "#4e936c",
          light: "#eaf2ec",
        },
        clay: {
          DEFAULT: "#b85344", // Sıcak kiremit (uyarı/hata)
          dark: "#cf6a5b",
          light: "#faeeec",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",   // 16px - standart kart ve inputlar
        lg: "0.75rem", // 12px - butonlar
      },
    },
  },
  plugins: [],
}