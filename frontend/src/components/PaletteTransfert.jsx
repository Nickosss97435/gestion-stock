import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaletteSortie = () => {
  const [fromPalette, setFromPalette] = useState(''); // Palette source
  const [toPalette, setToPalette] = useState(''); // Palette destination
  const [barcode, setBarcode] = useState(''); // Code-barres (ART_EAN)
  const [artCod, setArtCod] = useState(''); // Référence interne (ART_COD)
  const [quantity, setQuantity] = useState(''); // Quantité à transférer
  const [products, setProducts] = useState([]); // Liste des produits à transférer
  const [error, setError] = useState(null); // Gestion des erreurs
  const [searching, setSearching] = useState(false); // Indicateur de recherche
  const [depotsList, setDepots] = useState([]); // Liste des dépôts disponibles
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
  
      // Vérifier si les informations de stock sont valides
      if (!stock || typeof stock !== 'object') {
        throw new Error('Les informations de stock ne sont pas disponibles ou sont mal formatées.');
      }
  
      // Vérifier si la palette source est définie
      if (!fromPalette) {
        throw new Error('La palette source n\'est pas définie.');
      }
  
      // Chercher la quantité disponible dans le dépôt actuel
      const availableStock = parseInt(stock[depot] || 0); // Utilisez "depot" comme clé principale
  
      if (availableStock < 1) {
        throw new Error(`Le produit ${ART_COD} n'est pas disponible dans le dépôt sélectionné.`);
      }
  
      // Focus sur le champ "quantité" après une recherche réussie
      document.querySelector('input[name="quantity"]').focus();
  
      // Mettre à jour les états avec les données du produit
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
  
    // Vérifier si la quantité demandée est disponible dans le dépôt actuel
    const productInList = products.find(
      (product) => product.ART_COD === artCod && product.ART_PAL === fromPalette
    );
  
    if (productInList && parseInt(productInList.stock?.[depot] || 0) < parseInt(quantity)) {
      alert(
        `Quantité insuffisante pour le produit ${artCod}. Quantité disponible : ${productInList.stock?.[depot] || 0}`
      );
      return;
    }
  
    // Ajouter ou mettre à jour le produit dans la liste temporaire
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
    <div className="space-y-4">
      {/* Affichage d'un message de chargement si les données ne sont pas encore disponibles */}
      {searching && <p>Recherche en cours...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Ligne 1 : Société et Dépôt */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 md:w-1/2">
          <label className="text-blue-900 block text-sm font-medium mb-1">Société :</label>
          <select
            name="societe"
            value={societe}
            onChange={(e) => setSociete(e.target.value)}
            className="text-blue-900 w-full p-2 border rounded-md"
          >
            <option value="">Choisir une société</option>
            <option value="EPR">Entreprise EPR</option>
            <option value="GMR">Entreprise GMR</option>
            <option value="CPR">Entreprise CPR</option>
          </select>
        </div>

        <div className="flex-1 md:w-1/2">
          <label className="text-blue-900 block text-sm font-medium mb-1">Dépôt :</label>
          <select
            name="depot"
            value={depot}
            onChange={(e) => setDepot(e.target.value)}
            disabled={!depotsList.length}
            className="text-blue-900 w-full p-2 border rounded-md"
          >
            <option value="" disabled>{!depotsList.length ? 'Chargement...' : 'Choisir un dépôt'}</option>
            {depotsList?.map((depotItem) => (
              <option key={depotItem} value={depotItem}>
                {depotItem}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Palette Source et Destination */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Palette source :</label>
          <input
            type="text"
            name="fromPalette"
            placeholder="Code barre Palette source"
            value={fromPalette}
            onChange={(e) => setFromPalette(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Palette destination :</label>
          <input
            type="text"
            name="toPalette"
            placeholder="Code barre Palette destination"
            value={toPalette}
            onChange={(e) => setToPalette(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Code Barre (ART_EAN) et Référence Interne (ART_COD) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Code Barre (ART_EAN) :</label>
          <input
            type="text"
            name="barcode"
            placeholder="Code barre"
            value={barcode}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Référence Interne (ART_COD) :</label>
          <input
            type="text"
            name="artCod"
            placeholder="Référence Interne"
            value={artCod}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Quantité */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Quantité :</label>
        <input
          type="number"
          name="quantity"
          placeholder="Quantité"
          value={quantity}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Bouton pour ajouter un produit */}
      <button
        type="button"
        onClick={handleAddProduct}
        className="bg-blue-900 text-white p-2 rounded-md hover:bg-blue-800"
      >
        Ajouter
      </button>

      {/* Liste des produits à transférer */}
      {products.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700">Produits à transférer :</h3>
          <table className="min-w-full divide-y divide-gray-200 mt-2">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Palette Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Palette Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{product.ART_COD}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.ART_DES}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.ART_PAL}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.TO_ART_PAL}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) =>
                        setProducts(
                          products.map((prod, i) =>
                            i === index ? { ...prod, quantity: e.target.value } : prod
                          )
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() =>
                        setProducts(products.filter((_, i) => i !== index))
                      }
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bouton pour transférer les produits */}
      <button
        type="button"
        onClick={handleTransfer}
        className="bg-green-700 text-white p-2 rounded-md hover:bg-green-500"
      >
        Transférer les articles
      </button>
    </div>
  );
};

export default PaletteSortie;