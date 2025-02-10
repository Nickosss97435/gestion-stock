
// routes/stockRoutes.js
const express = require('express');
const stockController = require('../controllers/stockController');
const router = express.Router();

// Endpoint pour récupérer les matériaux électriques
router.get('/', stockController.getStock);

// Endpoint pour récupérer la liste des dépôts disponibles
router.get('/depots', stockController.getDepots);
router.get('/search-product', stockController.searchProduct); // Route pour rechercher un produit

module.exports = router;