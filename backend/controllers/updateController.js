// controllers/updateController.js
const { forceUpdateAll } = require('../utils/fileWatcher');

const forceUpdate = (req, res) => {
  try {
    forceUpdateAll();
    res.status(200).json({ message: 'Mise à jour forcée effectuée avec succès' }); // Utiliser JSON pour une API
  } catch (error) {
    console.error('Erreur lors de la mise à jour forcée :', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour forcée' }); // Utiliser JSON pour une API
  }
};

module.exports = {
  forceUpdate,
};
