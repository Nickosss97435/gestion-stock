const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const transfertRoutes = require('./routes/transfertRoutes');
const stockRoutes = require('./routes/stockRoutes');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/v1/transfert/', transfertRoutes);
app.use('/api/v1/stock/', stockRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});