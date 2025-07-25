import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
        sans: ["var(--font-inter)"],
        motley: ["MotleyForces", "sans-serif"],
        royando: ["Royando", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        'ai-glow': 'hsl(var(--ai-glow-color))',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pop-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 0 10px 3px hsl(var(--primary) / 0.7)" },
        },
        "ai-glow-kf": {
            "0%, 100%": { 
              borderColor: "hsl(var(--ai-glow-color) / 0.5)",
              boxShadow: "0 0 8px 1px hsl(var(--ai-glow-color) / 0.2)" 
            },
            "50%": { 
              borderColor: "hsl(var(--ai-glow-color) / 0.2)",
              boxShadow: "0 0 2px hsl(var(--ai-glow-color) / 0.1)" 
            },
        },
        "progress-popup": {
          "0%": { transform: "translateY(0px)", opacity: "1" },
          "100%": { transform: "translateY(-20px)", opacity: "0" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pop-glow": "pop-glow 1.2s ease-in-out",
        "button-glow": "button-glow 4s ease-in-out infinite",
        "ai-glow": "ai-glow-kf 3.5s ease-in-out infinite",
        "progress-popup": "progress-popup 4s cubic-bezier(0.25, 1, 0.5, 1) forwards",
      },
      textShadow: {
        DEFAULT: '1px 1px 2px rgba(0, 0, 0, 0.1)',
        md: '2px 2px 4px rgba(0, 0, 0, 0.2)',
        lg: '3px 3px 6px rgba(0, 0, 0, 0.3)',
        none: 'none',
        glow: '0 0 5px hsl(var(--primary)), 0 0 10px hsl(var(--primary) / 0.8)',
        outline: '-1px -1px 0 hsl(var(--background)), 1px -1px 0 hsl(var(--background)), -1px 1px 0 hsl(var(--background)), 1px 1px 0 hsl(var(--background)), 2px 2px 0px hsl(var(--primary) / 0.8)',
        'subtle-outline': '-1px -1px 1px hsl(var(--background) / 0.5), 1px 1px 1px hsl(var(--background) / 0.5)',
        'soft-glow': '0 0 8px hsl(var(--primary) / 0.5)',
        'stroke-black': '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    function({ addUtilities, theme }: {addUtilities: any, theme: any}) {
      const newUtilities = {
        '.text-shadow': {
          textShadow: theme('textShadow.DEFAULT'),
        },
        '.text-shadow-md': {
          textShadow: theme('textShadow.md'),
        },
        '.text-shadow-lg': {
          textShadow: theme('textShadow.lg'),
        },
        '.text-shadow-none': {
          textShadow: theme('textShadow.none'),
        },
        '.text-shadow-glow': {
          textShadow: theme('textShadow.glow'),
        },
        '.text-shadow-outline': {
          textShadow: theme('textShadow.outline'),
        },
        '.text-shadow-subtle-outline': {
          textShadow: theme('textShadow.subtle-outline'),
        },
         '.text-shadow-soft-glow': {
          textShadow: theme('textShadow.soft-glow'),
        },
        '.text-stroke-black': {
          textShadow: theme('textShadow.stroke-black'),
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ],
}

export default config;
