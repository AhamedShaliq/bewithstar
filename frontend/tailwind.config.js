/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF8F5', // Warm cream page background
        surfaceCard: '#FFFFFF', // Pure white card
        surfaceElevated: '#F5F0E8', // Warm elevated layer
        textPrimary: '#1C1917', // Near-black warm
        textSecondary: '#78716C', // Warm stone-500
        accent: '#B45309', // Warm amber/gold
        accentDark: '#92400E', // Darker amber hover
        accentLight: '#FEF3C7', // Amber highlight tint
        border: '#E7E0D5', // Warm parchment border
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'skeu': '0 1px 1px rgba(255,255,255,0.9) inset, 0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'skeu-lg': '0 1px 2px rgba(255,255,255,0.95) inset, 0 8px 32px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.08)',
        'skeu-inset': 'inset 0 2px 6px rgba(0,0,0,0.10), inset 0 1px 2px rgba(0,0,0,0.07)',
        'skeu-btn': '0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 4px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      },
      backgroundImage: {
        'skeu-btn-amber': 'linear-gradient(180deg, #F59E0B 0%, #B45309 100%)',
        'skeu-btn-dark': 'linear-gradient(180deg, #292524 0%, #1C1917 100%)',
        'skeu-card-surface': 'linear-gradient(180deg, #FFFFFF 0%, #FAF7F2 100%)',
        'skeu-noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
