// controllers/dataController.js
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const xlsxDir = path.join(dataDir, 'xlsx');
const jsonDir = path.join(dataDir, 'json');

const createDataDirectories = (req, res, next) => {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    if (!fs.existsSync(xlsxDir)) fs.mkdirSync(xlsxDir);
    if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir);
    next(); // Passe au middleware suivant
  } catch (error) {
    console.error('Erreur lors de la création des dossiers :', error);
    res.status(500).send('Erreur lors de la création des dossiers');
  }
};

const getJsonFile = (req, res) => {
  const filePath = path.join(__dirname, '../data/json', req.params.filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('Fichier non trouvé');
    }
  });
};

module.exports = {
  createDataDirectories,
  getJsonFile,
};
