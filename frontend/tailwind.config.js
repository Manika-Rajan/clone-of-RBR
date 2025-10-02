/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  // If Bootstrap is also loaded and resets clash, uncomment next line:
  // corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
