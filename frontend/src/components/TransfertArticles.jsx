import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TransfertArticles = () => {
  const [fromPalette, setFromPalette] = useState(''); // Palette source
  const [toPalette, setToPalette] = useState(''); // Palette destination
  const [barcode, setBarcode] = useState(''); // Code-barres (ART_EAN)
  const [artCod, setArtCod] = useState(''); // Référence interne (ART_COD)
  const [quantity, setQuantity] = useState(''); // Quantité à transférer
  const [products, setProducts] = useState([]); // Liste des produits à transférer
  const [error, setError] = useState(null); // Gestion des erreurs
  const [searching, setSearching] = useState(false); // Indicateur de recherche
  const [depotsList, setDepots] = useState([]); // Liste des dépôts disponibles
  const [palettes, setPalettes] = useState([]); // Liste des palettes disponibles
  const [societe, setSociete] = useState(''); // Société sélectionnée
  const [depot, setDepot] = useState(''); // Dépôt sélectionné

  // Récupérer la liste des dépôts disponibles
  const fetchDepots = async () => {
    try {
      if (!societe) return;
      const response = await axios.get('http://10.10.0.20:5000/api/v1/stock/depots', {
        params: { societe },
      });
      setDepots(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des dépôts.');
      console.error('Erreur lors du chargement des dépôts', err);
    }
  };

  // Charger les données initiales
  useEffect(() => {
    fetchDepots();
  }, [societe]);

  // Récupérer la liste des palettes disponibles
  const fetchPalettes = async () => {
    try {
      if (!societe || !depot) return;
      const response = await axios.get('http://10.10.0.20:5000/api/v1/stock/palettes', {
        params: { societe, depot },
      });
      setPalettes(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des palettes.');
      console.error('Erreur lors du chargement des palettes', err);
    }
  };

  useEffect(() => {
    if (societe && depot) {
      fetchPalettes();
    }
  }, [societe, depot]);

  // Rechercher un produit via l'API
  const fetchProductData = async (field, value) => {
    if (!value.trim()) return;
    setSearching(true);
    setError(null);

    try {
      const response = await axios.get('http://10.10.0.20:5000/api/v1/stock/search-product', {
        params: { societe, depot, [field]: value },
      });

      console.log('Réponse de l\'API:', response.data);

      const { ART_COD, ART_DES, FOU_NOM, ART_EAN, stock } = response.data;

      if (!stock || typeof stock !== 'object') {
        throw new Error('Les informations de stock ne sont pas disponibles ou sont mal formatées.');
      }

      if (!fromPalette) {
        throw new Error('La palette source n\'est pas définie.');
      }

      const availableStock = parseInt(stock[depot] || 0);

      if (availableStock < 1) {
        throw new Error(`Le produit ${ART_COD} n'est pas disponible dans le dépôt sélectionné.`);
      }

      document.querySelector('input[name="quantity"]').focus();

      setArtCod(ART_COD);
      setBarcode(ART_EAN);

      return { ART_COD, ART_DES, FOU_NOM, ART_EAN, stock };
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError(`Produit introuvable avec ${field} : "${value}".`);
      } else {
        setError(err.message || 'Une erreur est survenue lors de la recherche du produit.');
      }
      console.error('Erreur lors de la recherche du produit', err);
    } finally {
      setSearching(false);
    }
  };

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'fromPalette') {
      setFromPalette(value);
    } else if (name === 'toPalette') {
      setToPalette(value);
    } else if (name === 'barcode') {
      setBarcode(value);
      if (value.length === 13) {
        fetchProductData('ART_EAN', value);
      }
    } else if (name === 'artCod') {
      setArtCod(value);
      if (value.trim() && !barcode) {
        fetchProductData('ART_COD', value);
      }
    } else if (name === 'quantity') {
      setQuantity(value);
    }
  };

  // Ajouter un produit à la liste temporaire
  const handleAddProduct = () => {
    if (!societe || !depot || !fromPalette || !toPalette || !barcode || !quantity) {
      alert('Tous les champs sont requis.');
      return;
    }

    const productInList = products.find(
      (product) => product.ART_COD === artCod && product.ART_PAL === fromPalette
    );

    if (productInList && parseInt(productInList.stock?.[depot] || 0) < parseInt(quantity)) {
      alert(
        `Quantité insuffisante pour le produit ${artCod}. Quantité disponible : ${productInList.stock?.[depot] || 0}`
      );
      return;
    }

    const updatedProducts = products.map((product) =>
      product.ART_COD === artCod && product.ART_PAL === fromPalette
        ? { ...product, quantity: parseInt(quantity) }
        : product
    );

    if (!updatedProducts.find((product) => product.ART_COD === artCod && product.ART_PAL === fromPalette)) {
      updatedProducts.push({
        ART_COD: artCod,
        ART_EAN: barcode,
        ART_PAL: fromPalette,
        TO_ART_PAL: toPalette,
        quantity: parseInt(quantity),
        stock: {}, // Stock sera rempli lors du transfert final
      });
    }

    setProducts(updatedProducts);

    // Réinitialiser uniquement les champs qui doivent être vides
    setBarcode('');
    setArtCod('');
    setQuantity('');
  };

  // Soumettre tous les produits ajoutés
  const handleTransfer = async () => {
    if (!products.length) {
      alert('Aucun produit à transférer.');
      return;
    }

    try {
      const updatedProducts = await Promise.all(
        products.map(async (product) => {
          const { ART_COD, ART_EAN, ART_PAL, TO_ART_PAL, quantity } = product;

          // Vérifier si le produit existe dans le dépôt actuel
          const stockResponse = await axios.get('http://10.10.0.20:5000/api/v1/stock/search-product', {
            params: { societe, depot, ART_EAN, ART_COD },
          });

          const { stock } = stockResponse.data;

          if (parseInt(stock[depot] || 0) < quantity) {
            throw new Error(
              `Quantité insuffisante pour le produit ${ART_COD} dans le dépôt actuel. Quantité disponible : ${stock[depot] || 0}`
            );
          }

          return { ...product, stock: stock[depot] };
        })
      );

      // Envoyer la liste mise à jour au backend
      const response = await axios.post(
        'http://10.10.0.20:5000/api/v1/stock/transfer-articles',
        {
          societe,
          depot,
          fromPalette,
          toPalette,
          products: updatedProducts,
        }
      );

      console.log(response.data);
      alert('Transfert réussi.');

      // Réinitialiser complètement le formulaire après validation
      setFromPalette('');
      setToPalette('');
      setProducts([]);
    } catch (error) {
      console.error('Erreur lors du transfert', error);
      alert(error.message || 'Une erreur est survenue lors du transfert.');
    }
  };

  return (
    <div className="p-4">
      {/* Affichage d'un message de chargement */}
      {searching && <p>Recherche en cours...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Sélection de la société et du dépôt */}
      <div>
        <label>Société :</label>
        <select
          value={societe}
          onChange={(e) => setSociete(e.target.value)}
          className="text-blue-900 w-full p-2 border rounded-md"
        >
          <option>Choisir une société</option>
          <option value="EPR">Entreprise EPR</option>
          <option value="GMR">Entreprise GMR</option>
          <option value="CPR">Entreprise CPR</option>
        </select>

        <label>Dépôt :</label>
        <select
          value={depot}
          onChange={(e) => setDepot(e.target.value)}
          disabled={!depotsList.length}
          className="text-blue-900 w-full p-2 border rounded-md"
        >
          {!depotsList.length ? (
            <option>Chargement...</option>
          ) : (
            <option>Choisir un dépôt</option>
          )}
          {depotsList.map((depotItem) => (
            <option key={depotItem}>{depotItem}</option>
          ))}
        </select>
      </div>

      {/* Sélection des palettes */}
      <div>
        <label>Palette source :</label>
        <select
          value={fromPalette}
          onChange={(e) => setFromPalette(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        >
          <option>Choisir une palette</option>
          {palettes.map((palette) => (
            <option key={palette}>{palette}</option>
          ))}
        </select>

        <label>Palette destination :</label>
        <select
          value={toPalette}
          onChange={(e) => setToPalette(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        >
          <option>Choisir une palette</option>
          {palettes.map((palette) => (
            <option key={palette}>{palette}</option>
          ))}
        </select>
      </div>

      {/* Saisie du produit */}
      <div>
        <label>Code Barre (ART_EAN) :</label>
        <input
          type="text"
          name="barcode"
          value={barcode}
          onChange={handleChange}
          placeholder="Scanner ou entrer le code-barres"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />

        <label>Référence Interne (ART_COD) :</label>
        <input
          type="text"
          name="artCod"
          value={artCod}
          onChange={handleChange}
          placeholder="Entrer la référence interne"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />

        <label>Quantité :</label>
        <input
          type="number"
          name="quantity"
          value={quantity}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />

        <button onClick={handleAddProduct} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md">
          Ajouter
        </button>
      </div>

      {/* Liste des produits à transférer */}
      {products.length > 0 && (
        <table className="w-full border-collapse mt-4">
          <thead>
            <tr>
              <th className="border p-2">Référence</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Palette Source</th>
              <th className="border p-2">Palette Destination</th>
              <th className="border p-2">Quantité</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td className="border p-2">{product.ART_COD}</td>
                <td className="border p-2">{product.ART_DES || ''}</td>
                <td className="border p-2">{product.ART_PAL}</td>
                <td className="border p-2">{product.TO_ART_PAL}</td>
                <td className="border p-2">
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) =>
                      setProducts(
                        products.map((prod, i) =>
                          i === index ? { ...prod, quantity: parseInt(e.target.value) } : prod
                        )
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => setProducts(products.filter((_, i) => i !== index))}
                    className="bg-red-500 text-white px-2 py-1 rounded-md"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Bouton pour transférer les produits */}
      <button
        onClick={handleTransfer}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md"
        disabled={!products.length}
      >
        Transférer les articles
      </button>
    </div>
  );
};

export default TransfertArticles;