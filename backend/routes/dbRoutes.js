const express = require('express');
const router = express.Router();

// Importer les contrôleurs correctement
const dbController = require('../controllers/dbController');

// Routes pour gérer les produits et palettes
router.get('/depots', dbController.getDepots); // Récupérer la liste des dépôts
router.get('/search-product', dbController.searchProduct); // Route pour rechercher un produit dans {societe}_EXT001_Base Articles_Stock_Tarifs.xlsx

module.exports = router;