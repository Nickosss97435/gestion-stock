const express = require('express');
const router = express.Router();

// Importer les contrôleurs correctement
const transfertController = require('../controllers/transfertController'); // Ajoutez cette ligne

// Routes pour gérer les produits et palettes
router.post('/add-product', transfertController.addProduct); // Utilisez transfertController ici
router.get('/depots', transfertController.getDepots); // Récupérer la liste des dépôts
router.get('/search-product', transfertController.searchProduct); // Route pour rechercher un produit
router.post('/transfer-articles', transfertController.transferPalette); // Transférer des articles
router.post('/out-product', transfertController.outProduct); // Sortir un produit
router.get('/palettes', transfertController.getPalettes); // Récupérer les palettes
router.get('/locations', transfertController.getLocations); // Récupérer les emplacements
router.post('/export-excel', transfertController.exportExcel); // Exporter en Excel

module.exports = router;