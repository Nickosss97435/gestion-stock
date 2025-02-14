/projet-gestion-stock
│
├── /backend
│   ├── package.json
│   ├── server.js
│   ├── /routes
│   │   ├── stockRoutes.js
│   │   └── transfertRoutes.js
│   ├── /data
│   │   ├── /json
│   │   │   ├── EPR_EXT001_Base Articles_Stocks_Tarifs.json
│   │   │   ├── CPR_EXT001_Base Articles_Stocks_Tarifs.json
│   │   │   └── GMR_EXT001_Base Articles_Stocks_Tarifs.json
│   │   └── /xlsx
│   │       ├── EPR_EXT001_Base Articles_Stocks_Tarifs.xlsx
│   │       ├── CPR_EXT001_Base Articles_Stocks_Tarifs.xlsx
│   │       └── GMR_EXT001_Base Articles_Stocks_Tarifs.xlsx
│   ├── /controllers
│   │   ├── stockController.js
│   │   └── transfertController.js
│   ├── /models
│   │   └── Product.js
│   └── /utils
│       ├── cache.js
│       ├── fileWatcher.js
│       ├── excelToJson.js
│       ├── excelParser.js
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
│   │   │   ├── StockListe.jsx
│   │   │   ├── Sidbar.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── ProductForm.jsx
│   │   │   ├── PaletteSortie.jsx
│   │   │   ├── PaletteTransfert.jsx
│   │   │   └── ExportButton.jsx
│   │   ├── /pages
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Enter.jsx
│   │   │   ├── Sortie.jsx
│   │   │   └── Transfer.jsx
│   │   ├── /stores
│   │   │   ├── scannerStore.js
│   │   │   └── themeStore.js
│   │   └── /styles
│   │       └── main.css
│   └── /public
│       ├── vite.svg
│       └── filtres.json
└── README.md

npm create vite@latest frontend --template react
cd frontend
npm install
npm install react-router-dom axios @zxing/library
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

Ci-joint mes différents code, voici le fonctionnement de l'application: 

1ére page: page Recherche permet de rechercher un article en fonction de la société (BDU_STE), du dépot ({depot}_QTE), de la référence (ART_COD), de son code barre (ART_EAN), de ça designation ART_DES, du nom du fournisseur (FOU_NOM), du nom de la palette (ART_PAL), du nom de son emplacement ( ART_LOC) ces données sont stocké dans data/Stock/{societe}_{depot}_Stock.xlsx où data/Stock/{societe}_{depot}_Stock.json. il y aurra la possibilité d'exporter en excel le fichier celon les filtre renseigné de la societe et du dépot ou d'exporter le fichier de la societe et du dépot renseigné

2éme page: Page d'ajout de produit sur des palette et à des emplacements, le principe on selectionne la société puis le dépot, on renseigne ne nom de la palette, le nom de l'emplacemet ou ce situe la palette, puis en renseigne pour un recherche si le l'article existe dans data/json/{societe}_EXT001_Base Articles_Stock_Tarifs.json soit par le code barre soit par la référence de l'article si l'article existe, on affiche la designation puis on renseigne la quantité à mettre dan cette palette en cliquant sur le bouton ajouter, cela ajoute l'article à un tableau en dessous avec la possibilité de supprimer ou de modifier puis on passe a l'article suivant sans remettre a zéro la société, le dépot, le nom de la palette et le nom de l'emplacement, puis lorsque tous les produits son ajouté au tableau lorsque l'on clique sur valider le produit est ajouter au fichier {societe}_{depot}_Stock.xlsx.

3éme page: page de transfert de produit d'une palette à une autre et d'un emplacement à un autre, on selectionne l'entreprise, puis le dépôt, ensuite on renseigne le nom de la pallette souce ou les produits seron sortie, la palette de destination ou les produits seron entré si le produit n'existe pas dans la palette source, on affiche le un message d'erreur puis on renseigne le code barre pour chercher l'article si le code barre n'existe pas on recherche par la référence puis on renseigne la quantitée, on clique sur le bouton ajouter qui le rajoute à un tableau en dessous avec la possibilité de modifier ou de supprimer, une foit tous le produits ajouter dans le tableau lorsque l'on clique sur valider cela aura pour effet de déplacer ces produit

4ème page: page de sortie de stock pour sortire le produit de sa palette de son emplacement et donc du stock, on selectionne la société et le depot, puis on renseigne le nom de la palette source, ensuite on renseigne le code barre de l'article à sortir si on ne trouve pas d'article avcec le code barre on renseigne la référence si le produit n'existe pas dans cette palette on affiche un message d'erreur et si le produit n'existe pas aussi, si le produit est trouvé alors on renseigne la quantité puis on clique sur ajouter, ce qui ajoutera les produits a sortir dans un tableau en dessous et une fois que tous les produits à sortir sont dans le tableau alors on clique sur valider se qui sortira les quantité de produits renseigné dans la palette renseigné

pourrais tu me donner l'ensemble de codes au complet pour le backend et frontend pour cette application