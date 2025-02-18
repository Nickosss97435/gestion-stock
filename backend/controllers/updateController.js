const { forceUpdateAll } = require('../utils/excelToJson'); // Import correct

const forceUpdate = (req, res) => {
  try {
    forceUpdateAll();
    res.status(200).json({ message: 'Mise à jour forcée effectuée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour forcée :', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour forcée' });
  }
};

module.exports = {
  forceUpdate,
};
