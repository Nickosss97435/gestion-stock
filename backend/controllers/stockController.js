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

// Fonction pour valider le paramètre "societe"
function validateSociete(societe) {
  if (!societe || societe.length !== 3) {
    throw new Error('Paramètre "societe" manquant ou invalide');
  }
}

// Fonction pour nettoyer les valeurs
function cleanValue(value) {
  return (value || '').trim(); // Supprime les espaces avant/après
}

// Rechercher un produit par ART_EAN ou ART_COD Recherche pour la page recherche de transfert
exports.searchProduct = async (req, res) => {
    try {
      const { societe, depot, ART_EAN, ART_COD } = req.query;
  
      // Validation des paramètres
      if (!societe || !depot || (!ART_EAN && !ART_COD)) {
        return res.status(400).json({ error: 'Paramètres "societe", "depot", "ART_EAN" ou "ART_COD" requis.' });
      }
  
      // Construire le chemin vers le fichier de base
      const baseFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
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
      const stockFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
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
  
      const stock = {};
      if (stockItem) {
        // Ajouter les quantités pour chaque dépôt
        Object.keys(stockItem).filter((key) => key.endsWith('_QTE')).forEach((key) => {
          const depotName = key.split('_')[0];
          stock[depotName] = parseInt(stockItem[key]) || 0;
        });
      }
  
      res.status(200).json({
        ART_COD: foundART_COD || ART_COD,
        ART_DES,
        FOU_NOM,
        ART_EAN: foundART_EAN || ART_EAN,
        ART_PAL,
        stock, // Inclure les informations de stock dans la réponse
      });
    } catch (error) {
      console.error('Erreur lors de la recherche du produit :', error.message);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  };
  
// Récupérer les matériaux en fonction des filtres
exports.getStock = async (req, res) => {
  try {
    const { societe, depot, reference, referencefour, designation, codeBarre, stockMin, palettes, locations } = req.query;

    validateSociete(societe);

    // Construire le chemin vers le fichier de stock
    const fileName = `${societe}_${depot === 'Tous les dépôts' ? 'All_Depots' : depot}_Stock.xlsx`;
    const filePath = path.join(__dirname, '..', 'data', 'Stock', fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Fichier Excel introuvable pour la société "${societe}" et le dépôt "${depot}"` });
    }

    const stockData = readExcelFile(filePath);

    const filteredStock = stockData
      .filter((item) => {
        const matchesReference = !reference || cleanValue(item.ART_COD).includes(cleanValue(reference));
        const matchesReferencefour = !referencefour || cleanValue(item.FOU_NOM).includes(cleanValue(referencefour));
        const matchesDesignation = !designation || cleanValue(item.ART_DES).includes(cleanValue(designation));
        const matchesCodeBarre = !codeBarre || cleanValue(item.ART_EAN).includes(cleanValue(codeBarre));
        const matchesPalette = !palettes || cleanValue(item.ART_PAL).includes(cleanValue(palettes)); // Ajout du filtre ART_PAL
        const matchesLocation = !locations || cleanValue(item.ART_LOC).includes(cleanValue(locations)); // Ajout du filtre ART_LOC

        return (
          matchesReference &&
          matchesReferencefour &&
          matchesDesignation &&
          matchesCodeBarre &&
          matchesPalette &&
          matchesLocation
        );
      })
      .map((item) => {
        let totalStock = 0;

        if (depot === 'Tous les dépôts') {
          // Sommez toutes les colonnes _QTE
          Object.keys(item)
            .filter((key) => key.endsWith('_QTE'))
            .forEach((column) => {
              totalStock += parseInt(item[column]) || 0;
            });
        } else {
          // Utilisez uniquement la colonne correspondant au dépôt spécifié
          totalStock = parseInt(item[`${depot}_QTE`]) || 0;
        }

        // Calculer la valeur totale pour ce produit
        const totalValue = (parseFloat(item.CAT_POI) || 0) * totalStock;

        return {
          id: item.ART_COD || '',
          ean: item.ART_EAN || '',
          referencefour: item.FOU_NOM || '',
          nom: item.ART_DES || '',
          description: item.ART_TOP_L || '',
          prix: parseFloat(item.CAT_POI) || 0,
          tva: parseFloat(item.ART_TVA) || 0,
          stock: totalStock,
          depot: depot || 'Tous les dépôts',
          totalValue: totalValue.toFixed(2),
          ART_PAL: item.ART_PAL || '', // Palette
          ART_LOC: item.ART_LOC || '', // Emplacement
        };
      })
      .filter((item) => {
        // Filtrer par stock minimum
        const matchesStock = !stockMin || item.stock >= parseInt(stockMin);
        return matchesStock;
      });

    const totalProducts = filteredStock.length;
    const totalQuantity = filteredStock.reduce((sum, item) => sum + item.stock, 0);
    const totalStockValue = filteredStock.reduce((sum, item) => sum + parseFloat(item.totalValue), 0).toFixed(2);

    const response = {
      summary: {
        totalProducts,
        totalQuantity,
        totalStockValue,
      },
      stock: filteredStock,
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la lecture des données :', error.message);
    if (error.message.includes('Paramètre "societe"')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Récupérer la liste des dépôts disponibles
exports.getDepots = async (req, res) => {
  try {
    const { societe } = req.query;

    validateSociete(societe);

    const stockDirPath = path.join(__dirname, '..', 'data', 'Stock');
    if (!fs.existsSync(stockDirPath)) {
      console.error(`Répertoire de stock introuvable : ${stockDirPath}`);
      return res.status(404).json({ error: `Aucun fichier de stock trouvé pour la société "${societe}"` });
    }

    const files = fs.readdirSync(stockDirPath).filter((file) =>
      file.startsWith(`${societe}_`) && file.endsWith('_Stock.xlsx')
    );

    const depots = files.map((file) => file.split('_')[1].split('.')[0]); // Exemple : "EPR_S01_Stock.xlsx" -> "S01"

    res.status(200).json(depots);
  } catch (error) {
    console.error('Erreur lors de la récupération des dépôts :', error.message);
    if (error.message.includes('Paramètre "societe"')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};
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
    // ART_FAM_L,
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
    FOU_NOM, // Ajouter le fournisseur ici
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
// Dans votre contrôleur (par exemple, controllers/stockController.js)
exports.transferArticles = async (req, res) => {
  try {
      const { societe, depot, fromPalette, toPalette, products } = req.body;

      // Validation des données
      if (!societe || !depot || !fromPalette || !toPalette || !Array.isArray(products) || products.length === 0) {
          return res.status(400).json({ error: 'Toutes les données sont requises.' });
      }

      // Construire le chemin vers le fichier de stock
      const stockFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
      if (!fs.existsSync(stockFilePath)) {
          return res.status(404).json({ error: `Fichier Excel introuvable pour la société "${societe}" et le dépôt "${depot}".` });
      }

      let stockData = readExcelFile(stockFilePath);

      // Mettre à jour les quantités pour chaque produit
      for (const product of products) {
          const { ART_COD, ART_EAN, ART_PAL, quantity } = product;

          // Validation des données pour chaque produit
          if (!ART_COD || !ART_EAN || !ART_PAL || !quantity) {
              return res.status(400).json({ error: `Données manquantes pour le produit ${ART_COD}.` });
          }

          const parsedQuantity = parseInt(quantity, 10);
          if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
              return res.status(400).json({ error: `La quantité pour le produit ${ART_COD} doit être un nombre positif.` });
          }

          // Trouver le produit dans le fichier de stock
          const productIndex = stockData.findIndex(
              (item) => item.ART_COD === ART_COD && item.ART_PAL === fromPalette
          );

          if (productIndex === -1) {
              return res.status(404).json({ error: `Produit ${ART_COD} introuvable dans la palette ${fromPalette}.` });
          }

          // Vérifier si la quantité disponible est suffisante
          const availableQuantity = parseInt(stockData[productIndex][`${depot}_QTE`] || 0, 10);
          if (isNaN(availableQuantity) || availableQuantity < parsedQuantity) {
              return res.status(400).json({
                  error: `Quantité insuffisante pour le produit ${ART_COD}. Disponible : ${availableQuantity}, Demandée : ${parsedQuantity}.`,
              });
          }

          // Mettre à jour la quantité
          const newQuantity = availableQuantity - parsedQuantity;
          stockData[productIndex][`${depot}_QTE`] = newQuantity.toString();

          // Supprimer la ligne si la quantité devient zéro ou moins
          if (newQuantity <= 0) {
              stockData.splice(productIndex, 1);
          }
      }

      // Enregistrer les modifications dans le fichier de stock
      writeExcelFile(stockFilePath, stockData);

      res.status(200).json({ message: 'Transfert réussi.' });
  } catch (error) {
      console.error('Erreur lors du transfert des articles :', error);
      res.status(500).json({ error: error.message || 'Erreur interne du serveur.' });
  }
};


// Sortir un produit
// Sortir un produit
// Sortir un produit
exports.outProduct = async (req, res) => {
  try {
    const { societe, depot, fromPalette, products } = req.body;

    // Validation des données d'entrée
    if (!societe || !depot || !fromPalette || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Toutes les données sont requises.' });
    }

    // Construire le chemin vers le fichier de stock
    const stockFilePath = path.join(__dirname, '..', 'data', 'Stock', `${societe}_${depot}_Stock.xlsx`);
    if (!fs.existsSync(stockFilePath)) {
      return res.status(404).json({ error: `Fichier Excel introuvable pour la société "${societe}" et le dépôt "${depot}".` });
    }

    let stockData = readExcelFile(stockFilePath);

    // Mettre à jour les quantités pour chaque produit
    for (const product of products) {
      const { ART_COD, ART_EAN, ART_PAL, quantity } = product;

      // Validation des données pour chaque produit
      if (!ART_COD || !ART_EAN || !ART_PAL || !quantity) {
        return res.status(400).json({ error: `Données manquantes pour le produit ${ART_COD}.` });
      }

      const parsedQuantity = parseInt(quantity, 10);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({ error: `La quantité pour le produit ${ART_COD} doit être un nombre positif.` });
      }

      // Trouver le produit dans le fichier de stock
      const productIndex = stockData.findIndex(
        (item) => item.ART_COD === ART_COD && item.ART_PAL === fromPalette
      );

      if (productIndex === -1) {
        return res.status(404).json({ error: `Produit ${ART_COD} introuvable dans la palette ${fromPalette}.` });
      }

      // Vérifier si la quantité disponible est suffisante
      const availableQuantity = parseInt(stockData[productIndex][`${depot}_QTE`] || 0, 10);
      if (isNaN(availableQuantity) || availableQuantity < parsedQuantity) {
        return res.status(400).json({
          error: `Quantité insuffisante pour le produit ${ART_COD}. Disponible : ${availableQuantity}, Demandée : ${parsedQuantity}.`,
        });
      }

      // Mettre à jour la quantité
      const newQuantity = availableQuantity - parsedQuantity;
      if (newQuantity > 0) {
        stockData[productIndex][`${depot}_QTE`] = newQuantity.toString();
      } else {
        // Supprimer la ligne si la quantité devient zéro
        stockData.splice(productIndex, 1);
      }
    }

    // Enregistrer les modifications dans le fichier de stock
    writeExcelFile(stockFilePath, stockData);

    res.status(200).json({ message: 'Produits sortis avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la sortie des produits :', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur.' });
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