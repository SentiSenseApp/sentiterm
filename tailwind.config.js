/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0A0A0F',
          panel: '#12121A',
          border: '#1E1E2E',
          green: '#00FF88',
          amber: '#FFB800',
          red: '#FF4444',
          text: '#E8E8ED',
          muted: '#6B7280',
          surface: '#181825'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
