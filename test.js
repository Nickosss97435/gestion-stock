

// Ajouter plusieurs produits
exports.addProduct = async (req, res) => {
  try {
    // Your existing add product logic here
    const { societe, depot, products } = req.body;

    console.log('Données reçues :', req.body);

    // Validation des données d'entrée
    if (!societe || !depot || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Données invalides.' });
    }

    // Construire le chemin vers le fichier de stock
    const stockFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
    let stockData = readExcelFile(stockFilePath);

    for (const product of products) {
      const { ART_COD, ART_EAN, quantity, ART_PAL, ART_LOC } = product;

      // Validation des données pour chaque produit
      if (!ART_COD || !ART_EAN || !quantity || !ART_PAL || !ART_LOC) {
        return res.status(400).json({ error: 'Toutes les données sont requises pour chaque produit.' });
      }

      const parsedQuantity = parseInt(quantity, 10);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({ error: 'La quantité doit être un nombre positif.' });
      }

      // Vérifier si le produit existe dans le fichier de base
      const baseFilePath = path.join(__dirname, '..', 'data', `${societe}_EXT001_Base Articles_Stocks_Tarifs.xlsx`);
      if (!fs.existsSync(baseFilePath)) {
        return res.status(404).json({ error: `Fichier Excel introuvable pour la société "${societe}"` });
      }

      const baseProducts = readExcelFile(baseFilePath);
      const productExists = baseProducts.some(
        (item) => item.ART_COD === ART_COD && item.ART_EAN === ART_EAN
      );

      if (!productExists) {
        return res.status(400).json({ error: `Le produit ${ART_COD} n'existe pas dans le fichier de base.` });
      }

      // Récupérer les informations supplémentaires du produit depuis le fichier de base
      // Récupérer les informations supplémentaires du produit depuis le fichier de base
const productInfo = baseProducts.find(
  (item) => item.ART_COD === ART_COD && item.ART_EAN === ART_EAN
);

if (!productInfo) {
  return res.status(400).json({ error: `Informations manquantes pour le produit ${ART_COD}.` });
}

const {
  FOU_NOM,
  ART_DES,
  ART_DPT_L,
  ART_SFA,
  ART_SFA_L,
  ART_FAM_L,
  ART_UNV_L,
  CAT_RFF,
  CAT_DSF,
  CAT_PUA,
  CAT_COL,
  CAT_CND,
  CAT_MIN,
  CAT_VOL,
  CAT_POI,
} = productInfo;

// Vérifier si le produit existe déjà dans le fichier de stock
const existingProductIndex = stockData.findIndex(
  (item) => item.ART_COD === ART_COD && item.ART_PAL === ART_PAL && item.ART_LOC === ART_LOC
);

if (existingProductIndex !== -1) {
  // Mettre à jour la quantité si le produit existe déjà
  stockData[existingProductIndex][`${depot}_QTE`] = (
    parseInt(stockData[existingProductIndex][`${depot}_QTE`] || 0) + parsedQuantity
  ).toString();
} else {
  // Ajouter le produit s'il n'existe pas
  stockData.push({
    ART_COD,
    ART_EAN,
    ART_DES,
    ART_DPT_L,
    ART_SFA,
    ART_SFA_L,
    ART_FAM_L,
    ART_UNV_L,
    CAT_RFF,
    CAT_DSF,
    CAT_PUA,
    CAT_COL,
    CAT_CND,
    CAT_MIN,
    CAT_VOL,
    CAT_POI,
    [`${depot}_QTE`]: quantity.toString(),
    ART_PAL,
    NOM_FOU: FOU_NOM, // Ajouter le fournisseur ici
    ART_LOC,
  });
}
    }

    // Enregistrer les modifications dans le fichier de stock
    writeExcelFile(stockFilePath, stockData);

    res.status(200).json({ message: 'Produits ajoutés/mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout des produits :', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// Transférer une palette
exports.transferPalette = async (req, res) => {
  try {
    const { societe, depot, fromPalette, toPalette, products } = req.body;

    // Validation des données d'entrée
    if (!societe || !depot || !fromPalette || !toPalette || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Données invalides.' });
    }

    // Construire le chemin vers le fichier de stock
    const stockFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
    let stockData = readExcelFile(stockFilePath);

    // Initialiser les colonnes manquantes pour éviter les erreurs
    stockData.forEach((item) => {
      if (!item[`${depot}_QTE`]) {
        item[`${depot}_QTE`] = "0";
      }
    });

    // Mettre à jour les quantités pour chaque produit transféré
    for (const product of products) {
      const { ART_COD, quantity } = product;

      // Vérifier si le produit existe dans la palette source
      const fromProductIndex = stockData.findIndex(
        (item) => item.ART_COD === ART_COD && item.ART_PAL === fromPalette
      );
      if (fromProductIndex === -1) {
        throw new Error(`Produit ${ART_COD} introuvable dans la palette ${fromPalette}`);
      }

      // Décrémenter la quantité dans la palette source
      const currentQuantity = parseInt(stockData[fromProductIndex][`${depot}_QTE`] || 0);
      if (currentQuantity < parseInt(quantity)) {
        throw new Error(`Quantité insuffisante pour le produit ${ART_COD} dans la palette ${fromPalette}`);
      }
      stockData[fromProductIndex][`${depot}_QTE`] = (currentQuantity - parseInt(quantity)).toString();

      // Vérifier si le produit existe déjà dans la palette destination
      const toProductIndex = stockData.findIndex(
        (item) => item.ART_COD === ART_COD && item.ART_PAL === toPalette
      );

      if (toProductIndex !== -1) {
        // Incrémenter la quantité dans la palette destination
        const existingQuantity = parseInt(stockData[toProductIndex][`${depot}_QTE`] || 0);
        stockData[toProductIndex][`${depot}_QTE`] = (existingQuantity + parseInt(quantity)).toString();
      } else {
        // Ajouter une nouvelle ligne pour le produit dans la palette destination
        const newProduct = { ...stockData[fromProductIndex] };
        newProduct.ART_PAL = toPalette;
        newProduct[`${depot}_QTE`] = quantity.toString();
        stockData.push(newProduct);
      }
    }

    // Enregistrer les modifications dans le fichier de stock
    writeExcelFile(stockFilePath, stockData);
    res.status(200).json({ message: 'Palette transférée avec succès.' });
  } catch (error) {
    console.error('Erreur lors du transfert de palette :', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Sortir un produit
exports.outProduct = async (req, res) => {
  try {
    const { societe, depot, ART_COD, ART_PAL, quantity } = req.body;

    // Validation des données d'entrée
    if (!societe || !depot || !ART_COD || !ART_PAL || !quantity) {
      return res.status(400).json({ error: 'Toutes les données sont requises.' });
    }

    // Construire le chemin vers le fichier de stock
    const stockFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
    let stockData = readExcelFile(stockFilePath);
    
    // Vérifier si le fichier existe
    if (!stockData.length) {
      return res.status(404).json({ error: `Aucun fichier de stock trouvé pour la société "${societe}" et le dépôt "${depot}".` });
    }

    // Trouver le produit dans le fichier de stock
    const productIndex = stockData.findIndex(
      (item) => item.ART_COD === ART_COD && item.ART_PAL === ART_PAL
    );
    if (productIndex === -1) {
      return res.status(404).json({ error: `Produit ${ART_COD} introuvable dans la palette ${ART_PAL}` });
    }

    // Récupérer la quantité actuelle
    const currentQuantity = parseInt(stockData[productIndex][`${depot}_QTE`] || 0);
    const parsedQuantity = parseInt(quantity, 10);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ error: 'La quantité doit être un nombre positif.' });
    }

    if (currentQuantity < parsedQuantity) {
      return res.status(400).json({
        error: `Quantité insuffisante pour le produit ${ART_COD}. Quantité disponible : ${currentQuantity}`,
      });
    }

    // Décrémenter la quantité dans la palette source
    stockData[productIndex][`${depot}_QTE`] = (currentQuantity - parsedQuantity).toString();

    // Mettre à jour la quantité
    stockData[productIndex][`${depot}_QTE`] = (
      parseInt(stockData[productIndex][`${depot}_QTE`] || 0) - parseInt(quantity)
    ).toString();

    if (parseInt(stockData[productIndex][`${depot}_QTE`]) < 0) {
      return res.status(400).json({ error: `Quantité insuffisante pour le produit ${ART_COD}` });
    }

    // Enregistrer les modifications dans le fichier de stock
    writeExcelFile(stockFilePath, stockData);
    res.status(200).json({ message: 'Produit sorti avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la sortie du produit :', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// Récupérer la liste des palettes
exports.getPalettes = async (req, res) => {
  try {
    const { societe, depot } = req.query;

    if (!societe || !depot) {
      return res.status(400).json({ error: 'Paramètres "societe" et "depot" requis.' });
    }

    // Construire le chemin vers le fichier de stock
    const stockFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
    if (!fs.existsSync(stockFilePath)) {
      return res.status(404).json({ error: `Fichier Excel introuvable pour la société "${societe}" et le dépôt "${depot}"` });
    }

    const stockData = readExcelFile(stockFilePath);
    const palettes = [...new Set(stockData.map((item) => item.ART_PAL))];
    res.status(200).json(palettes);
  } catch (error) {
    console.error('Erreur lors de la récupération des palettes :', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// Récupérer la liste des emplacements
exports.getLocations = async (req, res) => {
  try {
    const { societe, depot } = req.query;

    if (!societe || !depot) {
      return res.status(400).json({ error: 'Paramètres "societe" et "depot" requis.' });
    }

    // Construire le chemin vers le fichier de stock
    const stockFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
    if (!fs.existsSync(stockFilePath)) {
      return res.status(404).json({ error: `Fichier Excel introuvable pour la société "${societe}" et le dépôt "${depot}"` });
    }

    const stockData = readExcelFile(stockFilePath);
    const locations = [...new Set(stockData.map((item) => item.ART_LOC))];
    res.status(200).json(locations);
  } catch (error) {
    console.error('Erreur lors de la récupération des emplacements :', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// Exporter les données de stock en Excel
exports.exportExcel = async (req, res) => {
  try {
    const { societe, depot } = req.body;

    if (!societe || !depot) {
      return res.status(400).json({ error: 'Paramètres "societe" et "depot" requis.' });
    }

    // Construire le chemin vers le fichier de stock
    const stockFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
    if (!fs.existsSync(stockFilePath)) {
      return res.status(404).json({ error: `Fichier Excel introuvable pour la société "${societe}" et le dépôt "${depot}"` });
    }

    const stockData = readExcelFile(stockFilePath);

    // Générer un nouveau fichier Excel pour l'export
    const exportFilePath = path.join(__dirname, '..', 'data', 'exports', `${societe}_${depot}_Export.xlsx`);
    writeExcelFile(exportFilePath, stockData);

    res.status(200).json({ message: 'Données exportées avec succès.', filePath: exportFilePath });
  } catch (error) {
    console.error('Erreur lors de l\'exportation des données :', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};