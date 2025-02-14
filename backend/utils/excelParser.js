const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

function parseExcel(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Le fichier "${filePath}" est introuvable.`);
    }
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier Excel : ${filePath}`, error.message);
    throw error;
  }
}

function loadProductsFromDataDir() {
  const dataDir = path.join(__dirname, '..', 'data');
  const products = [];
  
  try {
    if (!fs.existsSync(dataDir)) {
      throw new Error(`Le dossier "${dataDir}" n'existe pas.`);
    }
    
    const files = fs.readdirSync(dataDir);
    for (const file of files) {
      if (path.extname(file).toLowerCase() === '.xlsx') {
        const filePath = path.join(dataDir, file);
        const fileProducts = parseExcel(filePath);
        products.push(...fileProducts);
      }
    }
    
    console.log(`Chargés ${products.length} produits depuis le dossier /data.`);
    return products;
  } catch (error) {
    console.error('Erreur lors du chargement des produits depuis le dossier /data :', error.message);
    return [];
  }
}

module.exports = {
  parseExcel,
  loadProductsFromDataDir
};