// routes/dataRoutes.js
const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Route pour servir les fichiers JSON
router.get('/json/:filename', dataController.getJsonFile);

module.exports = router;
