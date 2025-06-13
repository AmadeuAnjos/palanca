/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html",
    "./cardapio.html",  
    "./sobre.html",
    "./contato.html",  
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {fontFamily: {
        cookie: ['Cookie', 'cursive'],
      },
      colors: {
        'primary': '#F59E0B',
        'secondary': '#FFE4E6',
        'third': '#78350F',
      },
    },
  },
  plugins: [],
}
