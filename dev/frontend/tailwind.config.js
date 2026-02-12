/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors - Ghana Police Brand
        primary: {
          blue: '#1A1F3A',
          yellow: '#F9A825',
        },
        // Background Colors
        background: {
          gray: '#F5F5F5',
          white: '#FFFFFF',
          dark: '#0A0D1F',
        },
        // Status Colors
        status: {
          success: '#4CAF50',
          warning: '#FF9800',
          error: '#F44336',
          info: '#2196F3',
        },
        // Text Colors
        text: {
          primary: '#212121',
          secondary: '#757575',
          muted: '#BDBDBD',
        },
        // Surface colors
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#FAFAFA',
          border: '#E0E0E0',
          'border-light': '#F0F0F0',
        }
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        'display': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'h2': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        'button': ['16px', { lineHeight: '1', fontWeight: '500' }],
        // Handheld sizes (larger for outdoor visibility)
        'handheld-h1': ['26px', { lineHeight: '1.3', fontWeight: '600' }],
        'handheld-h2': ['22px', { lineHeight: '1.4', fontWeight: '600' }],
        'handheld-body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'handheld-button': ['18px', { lineHeight: '1', fontWeight: '600' }],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      borderRadius: {
        'card': '8px',
        'card-lg': '12px',
        'button': '8px',
        'pill': '9999px',
        'input': '8px',
      },
      boxShadow: {
        'none': 'none',
        'input-focus': '0 0 0 2px rgba(26, 31, 58, 0.15)',
      },
      height: {
        'input-handheld': '56px',
        'input-desktop': '40px',
        'button-handheld': '56px',
        'button-desktop': '40px',
      },
      minHeight: {
        'input-handheld': '56px',
        'input-desktop': '40px',
        'button-handheld': '56px',
        'button-desktop': '40px',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
