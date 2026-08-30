module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Pure black — used only by the 3D hero / animation section.
        bg: '#000000',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', ' -apple-system', 'Segoe UI', 'Roboto'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
