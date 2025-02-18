const path = require('path');
const fs = require('fs');

// Fonction utilitaire pour lire un fichier JSON
const readJsonFile = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier JSON : ${error.message}`);
    return [];
  }
};

// Fonction utilitaire pour écrire dans un fichier JSON
const writeJsonFile = (filePath, data) => {
  const jsonData = JSON.stringify(data, null, 2); // Formatage JSON avec indentation
  fs.writeFileSync(filePath, jsonData, 'utf-8');
};

exports.getDepots = async (req, res) => {
  try {
    const { societe } = req.query;

    if (!societe) {
      return res.status(400).json({ error: 'Paramètre "societe" manquant.' });
    }

    // Construire le chemin vers le fichier JSON de base
    const baseFilePath = path.join(__dirname, '..', 'data',  'json', `${societe}_EXT001_Base Articles_Stocks_Tarifs.json`);
    if (!fs.existsSync(baseFilePath)) {
      return res.status(404).json({ error: `Fichier JSON introuvable pour la société "${societe}".` });
    }

    // Lire les données du fichier JSON
    const baseProducts = readJsonFile(baseFilePath);

    // Extraire les noms des dépôts disponibles
    const depotColumns = Object.keys(baseProducts[0] || {}).filter((key) => key.endsWith('_QTE'));
    const depots = depotColumns.map((column) => column.split('_')[0]);

    res.status(200).json(depots);
  } catch (error) {
    console.error('Erreur lors de la récupération des dépôts :', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

exports.searchProduct = async (req, res) => {
  try {
    const { societe, ART_EAN, ART_COD } = req.query;

    // Validation des données d'entrée
    if (!societe || (!ART_EAN && !ART_COD)) {
      return res.status(400).json({ error: 'Paramètres "societe", "ART_EAN" ou "ART_COD" requis.' });
    }

    // Construire le chemin vers le fichier JSON de base
    const baseFilePath = path.join(__dirname, '..', 'data', 'json', `${societe}_EXT001_Base Articles_Stocks_Tarifs.json`);
    if (!fs.existsSync(baseFilePath)) {
      return res.status(404).json({ error: `Fichier JSON introuvable pour la société "${societe}".` });
    }

    // Lire les données du fichier JSON
    const baseProducts = readJsonFile(baseFilePath);

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

    // Extraire les informations nécessaires
    const {
      ART_COD: foundART_COD,
      ART_DES,
      FOU_NOM,
      ART_EAN: foundART_EAN,
      ART_PAL,
    } = productInfo;

    res.status(200).json({
      ART_COD: foundART_COD || ART_COD,
      ART_DES,
      FOU_NOM,
      ART_EAN: foundART_EAN || ART_EAN,
      ART_PAL,
    });
  } catch (error) {
    console.error('Erreur lors de la recherche du produit :', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};