import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ProductForm({ onAddProduct }) {
  const [product, setProduct] = useState({
    ART_COD: '',
    ART_EAN: '',
    quantity: '', // Quantité
    ART_PAL: '',
    ART_LOC: '',
    societe: '',
    depots: '',
    ART_DES: '',
  });

  const [palette, setPalette] = useState([]);
  const [locations, setLocations] = useState([]);
  const [depotsList, setDepots] = useState([]);
  const [loading, setLoading] = useState(false); // Indicateur de chargement
  const [error, setError] = useState(null); // Gestion des erreurs
  const [searching, setSearching] = useState(false); // Indicateur de recherche
  const [productsList, setProductsList] = useState([]); // Liste des produits à valider

  // Récupérer la liste des dépôts disponibles
  const fetchDepots = async () => {
    try {
      if (!product.societe) return;
      const response = await axios.get('http://10.10.0.20:5000/api/v1/stock/depots', {
        params: { societe: product.societe },
      });
      setDepots(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des dépôts.');
      console.error('Erreur lors du chargement des dépôts', err);
    }
  };

  // Méthode pour rechercher un produit avec un délai (debounce)
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchProductData = async (field, value) => {
    setSearching(true);
    setError(null);

    try {
      const response = await axios.get('http://10.10.0.20:5000/api/v1/transfert/search-product', {
        params: { societe: product.societe, [field]: value },
      });

      const { ART_COD, ART_DES, FOU_NOM, ART_EAN } = response.data;

      setProduct((prevProduct) => ({
        ...prevProduct,
        ART_COD: field === 'ART_EAN' ? ART_COD || '' : prevProduct.ART_COD,
        ART_DES: ART_DES || '',
        FOU_NOM: FOU_NOM || '',
        ART_EAN: ART_EAN || '',
      }));
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError(`Produit introuvable avec ${field} : "${value}".`);
      } else {
        setError('Une erreur est survenue lors de la recherche du produit.');
      }
      console.error('Erreur lors de la recherche du produit', err);
    } finally {
      setSearching(false);
    }
  };

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;

    setProduct((prevProduct) => {
      const updatedProduct = { ...prevProduct, [name]: value };

      // Si ART_EAN est modifié, déclenchez une recherche après un délai
      if (name === 'ART_EAN') {
        clearTimeout(searchTimeout); // Annulez toute recherche précédente
        setSearchTimeout(
          setTimeout(() => {
            if (value.length === 13) { // Vérifiez que le code-barres est complet
              fetchProductData('ART_EAN', value);
            }
          }, 500) // Attendez 500ms avant de déclencher la recherche
        );
      }

      // Si ART_COD est modifié et que ART_DES n'est pas encore rempli, recherchez automatiquement
      if (name === 'ART_COD' && !updatedProduct.ART_DES) {
        fetchProductData('ART_COD', value);
      }

      return updatedProduct;
    });
  };

  // Ajouter un produit à la liste temporaire
  const handleAddProduct = () => {
    if (
      !product.societe ||
      !product.depots ||
      !product.ART_COD ||
      !product.ART_EAN ||
      !product.quantity ||
      !product.ART_PAL ||
      !product.ART_LOC
    ) {
      alert('Tous les champs sont requis.');
      return;
    }

    // Vérifiez si le produit existe déjà dans la liste
    const existingProductIndex = productsList.findIndex(
      (item) =>
        item.ART_COD === product.ART_COD &&
        item.ART_PAL === product.ART_PAL &&
        item.ART_LOC === product.ART_LOC
    );

    if (existingProductIndex !== -1) {
      alert('Le produit est déjà dans la liste.');
      return;
    }
    

    // Ajoutez le produit à la liste temporaire
    console.log('Avant mise à jour de productsList :', productsList);
setProductsList((prevList) => [
  ...prevList,
  {
    ART_COD: product.ART_COD,
    ART_EAN: product.ART_EAN,
    ART_DES: product.ART_DES,
    quantity: product.quantity,
    ART_PAL: product.ART_PAL,
    ART_LOC: product.ART_LOC,
  },
]);
console.log('Après mise à jour de productsList :', productsList);

    // Réinitialisez uniquement les champs qui doivent être vides
    setProduct((prevProduct) => ({
      ...prevProduct,
      ART_COD: '',
      ART_EAN: '',
      quantity: '',
      ART_DES: '',
    }));
  };

  // Soumettre tous les produits ajoutés
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productsList.length) {
      alert('Aucun produit à ajouter.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Envoyer la liste des produits au backend
      const response = await axios.post(
        'http://10.10.0.20:5000/api/v1/transfert/add-product',
        {
          societe: product.societe,
          depot: product.depots,
          products: productsList,
        }
      );

      onAddProduct(response.data);

      // Réinitialiser complètement le formulaire après validation
      setProduct({
        ART_COD: '',
        ART_EAN: '',
        quantity: '',
        ART_PAL: '',
        ART_LOC: '',
        societe: '',
        depots: '',
        ART_DES: '',
      });
      setProductsList([]);
      alert('Produits ajoutés avec succès.');
    } catch (error) {
      console.error('Erreur lors de l\'ajout des produits', error);
      if (error.response && error.response.data.error) {
        alert(error.response.data.error);
      } else {
        alert('Une erreur est survenue lors de l\'ajout des produits.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchDepots();
      } catch (err) {
        setError('Une erreur est survenue lors du chargement des données.');
        console.error('Erreur lors du chargement des données', err);
      }
    };
    loadData();
  }, [product.societe]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Affichage d'un message de chargement si les données ne sont pas encore disponibles */}
      {loading && <p>Validation en cours...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {searching && <p>Recherche en cours...</p>}

      {/* Ligne 1 : Société et Dépôt */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 md:w-1/2">
          <label className="text-blue-900 block text-sm font-medium mb-1">Société :</label>
          <select
            name="societe"
            value={product.societe}
            onChange={handleChange}
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
            name="depots"
            value={product.depots}
            onChange={handleChange}
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

      {/* Palette et Emplacement */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 md:w-1/2">
          <label className="block text-sm font-medium text-gray-700">Palette (ART_PAL) :</label>
          <input
            type="text"
            name="ART_PAL"
            placeholder="Numéro de Palette"
            value={product.ART_PAL}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex-1 md:w-1/2">
          <label className="block text-sm font-medium text-gray-700">Emplacement (ART_LOC) :</label>
          <input
            type="text"
            name="ART_LOC"
            placeholder="Emplacement"
            value={product.ART_LOC}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Code Barre (ART_EAN) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Code Barre (ART_EAN) :</label>
        <input
          type="text"
          name="ART_EAN"
          placeholder="Code Barre"
          value={product.ART_EAN}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Référence (ART_COD) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Référence (ART_COD) :</label>
        <input
          type="text"
          name="ART_COD"
          placeholder="Référence Interne"
          value={product.ART_COD}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Description (ART_DES) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Description (ART_DES) :</label>
        <input
          type="text"
          name="ART_DES"
          placeholder="Description"
          value={product.ART_DES || ''}
          readOnly
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Quantité */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Quantité :</label>
        <input
          type="number"
          name="quantity"
          placeholder="Quantité"
          value={product.quantity}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Bouton pour ajouter un produit */}
      <button
        type="button"
        onClick={handleAddProduct}
        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        disabled={loading || !depotsList.length}
      >
        Ajouter le produit
      </button>

      {/* Liste des produits ajoutés */}
      {productsList.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700">Produits ajoutés :</h3>
          <table className="min-w-full divide-y divide-gray-200 mt-2">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Palette</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emplacement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productsList.map((prod, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{prod.ART_COD}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{prod.ART_DES}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{prod.ART_PAL}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{prod.ART_LOC}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={prod.quantity}
                      onChange={(e) =>
                        setProductsList(
                          productsList.map((item, i) =>
                            i === index ? { ...item, quantity: e.target.value } : item
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
                        setProductsList(productsList.filter((_, i) => i !== index))
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

      {/* Bouton pour valider tous les produits */}
      <button
        type="submit"
        className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
        disabled={!productsList.length}
      >
        Valider tous les produits
      </button>
    </form>
  );
}

export default ProductForm;