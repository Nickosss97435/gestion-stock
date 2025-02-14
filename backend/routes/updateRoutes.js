// routes/updateRoutes.js
const express = require('express');
const router = express.Router(); // Créez un routeur Express
const updateController = require('../controllers/updateController');

// Route pour forcer la mise à jour
router.post('/force-update', updateController.forceUpdate);

module.exports = router;
