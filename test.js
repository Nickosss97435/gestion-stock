const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// Fonction utilitaire pour lire un fichier Excel
const readExcelFile = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
};

// Fonction utilitaire pour écrire dans un fichier Excel
const writeExcelFile = (filePath, data) => {
  const workbook = xlsx.utils.book_new();
  const sheet = xlsx.utils.json_to_sheet(data);
  xlsx.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  xlsx.writeFile(workbook, filePath);
};

// Ajouter un produit
exports.addProduct = async (req, res) => {
  try {
    const { societe, depot, ART_COD, ART_EAN, _QTE, ART_PAL, ART_LOC } = req.body;

    console.log('Données reçues :', req.body);

    // Validation des données d'entrée
    if (!societe || !depot || !ART_COD || !ART_EAN || !_QTE || !ART_PAL || !ART_LOC) {
      return res.status(400).json({ error: 'Toutes les données sont requises.' });
    }

    const quantity = parseInt(_QTE, 10);
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'La quantité doit être un nombre positif.' });
    }

    // Vérifier si le produit existe dans le fichier de base
    const baseFilePath = path.join(__dirname, '..', 'data', `${societe}_EXT001_Base Articles_Stocks_Tarifs.xlsx`);
    if (!fs.existsSync(baseFilePath)) {
      return res.status(404).json({ error: `Fichier Excel introuvable pour la société "${societe}"` });
    }

    const baseProducts = readExcelFile(baseFilePath);
    const productExists = baseProducts.some(
      (product) => product.ART_COD === ART_COD && product.ART_EAN === ART_EAN
    );

    if (!productExists) {
      return res.status(400).json({ error: 'Le produit n\'existe pas dans le fichier de base.' });
    }

    const productInfo = baseProducts.find(
      (product) => product.ART_COD === ART_COD && product.ART_EAN === ART_EAN
    );

    const {
      BDU_STE,  
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

    // Construire le chemin vers le fichier de stock
    const stockFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
    let stockData = readExcelFile(stockFilePath);

    // Ajouter ou mettre à jour le produit dans le fichier de stock
    const existingProductIndex = stockData.findIndex(
      (item) => item.ART_COD === ART_COD && item.ART_PAL === ART_PAL && item.ART_LOC === ART_LOC
    );

    if (existingProductIndex !== -1) {
      stockData[existingProductIndex][`${depot}_QTE`] = (
        parseInt(stockData[existingProductIndex][`${depot}_QTE`] || 0) + parseInt(_QTE)
      ).toString();
    } else {
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
        [`${depot}_QTE`]: _QTE.toString(),
        ART_PAL,
        NOM_FOU: FOU_NOM,
        ART_LOC,
      });
    }

    // Enregistrer les modifications dans le fichier de stock
    writeExcelFile(stockFilePath, stockData);

    res.status(200).json({ message: 'Produit ajouté/mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du produit :', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// Transférer une palette
exports.transferPalette = async (req, res) => {
  try {
    const { societe, depot, fromPalette, toPalette, products } = req.body;

    if (!societe || !depot || !fromPalette || !toPalette || !products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Données invalides.' });
    }

    const stockFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
    let stockData = readExcelFile(stockFilePath);

    products.forEach((product) => {
      const { ART_COD, quantity } = product;

      const fromProductIndex = stockData.findIndex(
        (item) => item.ART_COD === ART_COD && item.ART_PAL === fromPalette
      );

      if (fromProductIndex === -1) {
        throw new Error(`Produit ${ART_COD} introuvable dans la palette ${fromPalette}`);
      }

      stockData[fromProductIndex][`${depot}_QTE`] = (
        parseInt(stockData[fromProductIndex][`${depot}_QTE`] || 0) - parseInt(quantity)
      ).toString();

      if (parseInt(stockData[fromProductIndex][`${depot}_QTE`]) < 0) {
        throw new Error(`Quantité insuffisante pour le produit ${ART_COD} dans la palette ${fromPalette}`);
      }

      const toProductIndex = stockData.findIndex(
        (item) => item.ART_COD === ART_COD && item.ART_PAL === toPalette
      );

      if (toProductIndex !== -1) {
        stockData[toProductIndex][`${depot}_QTE`] = (
          parseInt(stockData[toProductIndex][`${depot}_QTE`] || 0) + parseInt(quantity)
        ).toString();
      } else {
        const productInfo = stockData[fromProductIndex];
        productInfo.ART_PAL = toPalette;
        productInfo[`${depot}_QTE`] = quantity.toString();
        stockData.push(productInfo);
      }
    });

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

    if (!societe || !depot || !ART_COD || !ART_PAL || !quantity) {
      return res.status(400).json({ error: 'Toutes les données sont requises.' });
    }

    const stockFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
    let stockData = readExcelFile(stockFilePath);

    const productIndex = stockData.findIndex(
      (item) => item.ART_COD === ART_COD && item.ART_PAL === ART_PAL
    );

    if (productIndex === -1) {
      return res.status(404).json({ error: `Produit ${ART_COD} introuvable dans la palette ${ART_PAL}` });
    }

    stockData[productIndex][`${depot}_QTE`] = (
      parseInt(stockData[productIndex][`${depot}_QTE`] || 0) - parseInt(quantity)
    ).toString();

    if (parseInt(stockData[productIndex][`${depot}_QTE`]) < 0) {
      return res.status(400).json({ error: `Quantité insuffisante pour le produit ${ART_COD}` });
    }

    writeExcelFile(stockFilePath, stockData);
    res.status(200).json({ message: 'Produit sorti avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la sortie du produit :', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// Rechercher un produit par ART_EAN ou ART_COD
exports.searchProduct = async (req, res) => {
  try {
    const { societe, ART_EAN, ART_COD } = req.query;

    if (!societe || (!ART_EAN && !ART_COD)) {
      return res.status(400).json({ error: 'Paramètres "societe", "ART_EAN" ou "ART_COD" requis.' });
    }

    const baseFilePath = path.join(__dirname, '..', 'data', `${societe}_EXT001_Base Articles_Stocks_Tarifs.xlsx`);
    if (!fs.existsSync(baseFilePath)) {
      return res.status(404).json({ error: `Fichier Excel introuvable pour la société "${societe}"` });
    }

    const baseProducts = readExcelFile(baseFilePath);
    const productInfo = baseProducts.find(
      (product) => (ART_EAN ? product.ART_EAN === ART_EAN : product.ART_COD === ART_COD)
    );

    if (!productInfo) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    const { ART_COD: foundART_COD, ART_DES, FOU_NOM, ART_EAN: foundART_EAN } = productInfo;

    res.status(200).json({
      ART_COD: foundART_COD || ART_COD,
      ART_DES,
      FOU_NOM,
      ART_EAN: foundART_EAN || ART_EAN,
    });
  } catch (error) {
    console.error('Erreur lors de la recherche du produit :', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};