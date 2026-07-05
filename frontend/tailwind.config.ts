import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F7FA",
        surface: "#FFFFFF",
        border: {
          DEFAULT: "#E2E6EC",
          strong: "#CBD2DE",
        },
        ink: {
          DEFAULT: "#12161F",
          muted: "#5B6472",
          faint: "#8B93A1",
        },
        brand: {
          DEFAULT: "#1E3A5F",
          light: "#2F6FED",
          50: "#EEF3FC",
        },
        integrity: {
          clean: "#5B6472",
          flagged: "#B45309",
          "flagged-bg": "#FDF3E7",
          corrupt: "#B91C1C",
          "corrupt-bg": "#FCEDEC",
        },
        state: {
          pending: "#64748B",
          progress: "#2F6FED",
          resolved: "#15803D",
          blocked: "#B91C1C",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        xxs: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(18, 22, 31, 0.04), 0 1px 0 rgba(18, 22, 31, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
