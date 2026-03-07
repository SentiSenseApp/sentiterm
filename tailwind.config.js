/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0D0F1A',
          panel: '#131525',
          border: '#1E2035',
          accent: '#3182CE',
          bull: '#2DD4BF',
          amber: '#E8A930',
          red: '#F87171',
          text: '#E8E8ED',
          muted: '#6B7280',
          surface: '#1A1D30'
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
