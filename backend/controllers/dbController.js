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

// Récupérer la liste des dépôts disponibles
exports.getDepots = async (req, res) => {
  try {
    const { societe } = req.query;
    if (!societe) {
      return res.status(400).json({ error: 'Paramètre "societe" manquant.' });
    }

    // Lire le fichier de base pour extraire les dépôts
    const baseFilePath = path.join(__dirname, '..', 'data', `${societe}_EXT001_Base Articles_Stocks_Tarifs.xlsx`);
    if (!fs.existsSync(baseFilePath)) {
      return res.status(404).json({ error: `Fichier Excel introuvable pour la société "${societe}"` });
    }

    const baseProducts = readExcelFile(baseFilePath);
    const depotColumns = Object.keys(baseProducts[0]).filter((key) => key.endsWith('_QTE'));
    const depots = depotColumns.map((column) => column.split('_')[0]);

    res.status(200).json(depots);
  } catch (error) {
    console.error('Erreur lors de la récupération des dépôts :', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// Rechercher un produit par ART_EAN ou ART_COD
exports.searchProduct = async (req, res) => {
  try {
    const { societe, ART_EAN, ART_COD } = req.query;

    // Validation des données d'entrée
    if (!societe || (!ART_EAN && !ART_COD)) {
      return res.status(400).json({ error: 'Paramètres "societe", "ART_EAN" ou "ART_COD" requis.' });
    }

    // Construire le chemin vers le fichier de base
    const baseFilePath = path.join(__dirname, '..', 'data', `${societe}_EXT001_Base Articles_Stocks_Tarifs.xlsx`);
    if (!fs.existsSync(baseFilePath)) {
      return res.status(404).json({ error: `Fichier Excel introuvable pour la société "${societe}"` });
    }

    // Lire les données du fichier Excel
    const baseProducts = readExcelFile(baseFilePath);

    // Recherche du produit
    let productInfo;
    if (ART_EAN && ART_EAN.length === 13) {
      productInfo = baseProducts.find((product) => product.ART_EAN === ART_EAN);
    } else if (ART_COD) {
      productInfo = baseProducts.find((product) => product.ART_COD === ART_COD);
    }

    if (!productInfo) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    // Construire le chemin vers le fichier de stock pour récupérer les quantités
    const stockFilePath = path.join(__dirname, '..', 'data', `${societe}_EXT001_Base Articles_Stocks_Tarifs.xlsx`);
    const stockData = readExcelFile(stockFilePath);

    // Trouver le produit dans le fichier de stock
    const stockItem = stockData.find(
      (item) => item.ART_COD === productInfo.ART_COD && item.ART_PAL === productInfo.ART_PAL
    );

    // Extraire les informations nécessaires
    const {
      ART_COD: foundART_COD,
      ART_DES,
      FOU_NOM,
      ART_EAN: foundART_EAN,
      ART_PAL,
    } = productInfo;

    // const stock = {};
    // if (stockItem) {
    //   // Ajouter les quantités pour chaque dépôt
    //   Object.keys(stockItem).filter((key) => key.endsWith('_QTE')).forEach((key) => {
    //     const depotName = key.split('_')[0];
    //     stock[depotName] = parseInt(stockItem[key]) || 0;
    //   });
    // }

    // // Vérifier si le dépôt spécifié existe dans les données de stock
    // if (!stock[depot]) {
    //   return res.status(404).json({ error: `Aucune donnée de stock trouvée pour le dépôt "${depot}".` });
    // }

    res.status(200).json({
      ART_COD: foundART_COD || ART_COD,
      ART_DES,
      FOU_NOM,
      ART_EAN: foundART_EAN || ART_EAN,
      ART_PAL,
      // stock, // Inclure les informations de stock dans la réponse
    });
  } catch (error) {
    console.error('Erreur lors de la recherche du produit :', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};
