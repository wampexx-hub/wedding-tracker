/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            colors: {
                champagne: {
                    DEFAULT: '#D4AF37',
                    hover: '#C5A028',
                    light: '#F3E5AB',
                },
                sage: {
                    DEFAULT: '#9CAF88',
                    dark: '#7A8C69',
                }
            }
        },
    },
    plugins: [],
}
