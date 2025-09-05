// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Your content paths. This tells Tailwind where to look for class names.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Expanded to include all relevant file types
  ],

  // Your theme configuration
  theme: {
    extend: {},
  },

  // Your plugins, including the one we added for scrollbar hiding
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
}