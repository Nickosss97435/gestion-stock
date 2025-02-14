// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');


const dbRoutesRoutes = require('./routes/dbRoutes');
const stockRoutes = require('./routes/stockRoutes');
const dataRoutes = require('./routes/dataRoutes');
const updateRoutes = require('./routes/updateRoutes'); // Importez les nouvelles routes

const { startFileWatcher }  = require('./utils/fileWatcher');
const dataController = require('./controllers/dataController');


const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json()); // Pour analyser les corps de requête JSON
app.use(express.json());

// Crée les dossiers data/xlsx et data/json s'ils n'existent pas
app.use(dataController.createDataDirectories);

// Routes
app.use('/api/v1/db/', dbRoutesRoutes);
app.use('/api/v1/stock/', stockRoutes);
app.use('/api/data/', dataRoutes);
app.use('/api/data/', updateRoutes); // Utilisez les routes de mise à jour

app.listen(PORT, () => {
  console.log(`Server running on http://10.10.0.20:${PORT}`);
  startFileWatcher();
});
