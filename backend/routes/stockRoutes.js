
// routes/stockRoutes.js
const express = require('express');
const stockController = require('../controllers/stockController');
const router = express.Router();

// Endpoint pour récupérer les matériaux électriques
router.get('/', stockController.getStock);

// Endpoint pour récupérer la liste des dépôts disponibles
router.get('/depots', stockController.getDepots);
router.get('/search-product', stockController.searchProduct); // Route pour rechercher un produit
router.get('/search-palette-location', stockController.searchPaletteLocation); // Route pour rechercher un produit
router.post('/add-product', stockController.addProduct); // Utilisez transfertController ici
router.post('/transfer-articles', stockController.transferArticles); // Transférer des articles
router.post('/transfer-palette-location', stockController.transferPaletteLocation); // Transférer de palette
router.post('/out-product', stockController.outProduct); // Sortir un produit
router.get('/palettes', stockController.getPalettes); // Récupérer les palettes
router.get('/locations', stockController.getLocations); // Récupérer les emplacements
router.post('/export-excel', stockController.exportExcel); // Exporter en Excel
router.post('/export-stock', stockController.exportStock); // Exporter en Excel

module.exports = router;