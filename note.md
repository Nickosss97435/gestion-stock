/projet-gestion-palettes
│
├── /backend
│   ├── package.json
│   ├── server.js
│   ├── /routes
│   │   └── api.js
│   ├── /controllers
│   │   └── productController.js
│   ├── /models
│   │   └── Product.js
│   └── /utils
│       └── excelHandler.js
│
├── /frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.js
│   ├── index.html
│   ├── /src
│   │   ├── App.jsx
│   │   ├── /components
│   │   │   ├── Scanner.jsx
│   │   │   ├── Sidbar.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── ProductForm.jsx
│   │   │   ├── PaletteManager.jsx
│   │   │   └── ExportButton.jsx
│   │   ├── /pages
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Transfer.jsx
│   │   └── /styles
│   │       └── main.css
│   └── /public
│       ├── vite.svg
└── README.md

npm create vite@latest frontend --template react
cd frontend
npm install
npm install react-router-dom axios @zxing/library
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p