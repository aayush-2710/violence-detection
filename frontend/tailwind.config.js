/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/app/**/*.{js,jsx,ts,tsx}',
        './src/components/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                bg: '#0C0E13',
                surface: '#141720',
                raised: '#1C2030',
                border: '#252A3A',
                'border-active': '#3D4560',
                accent: '#5B8CFF',
                mint: '#4FFFB0',
                amber: '#FFB84F',
                danger: '#FF5757',
                'text-primary': '#E8EAF0',
                'text-secondary': '#7A8099',
                'text-muted': '#454D65',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}