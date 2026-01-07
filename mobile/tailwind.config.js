/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./screens/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                champagne: {
                    DEFAULT: '#D4AF37',
                    hover: '#C5A028',
                    light: '#F3E5AB',
                    dark: '#C5A028',
                },
                background: '#FDFBF7',
            },
        },
    },
    plugins: [],
}
