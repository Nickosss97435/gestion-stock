import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ProductForm({ onAddProduct }) {
  const [product, setProduct] = useState({
    ART_COD: '',
    ART_EAN: '',
    quantity: '',
    ART_PAL: '',
    ART_LOC: '',
    societe: '',
    depots: '',
    ART_DES: '',
  });

  const [palette, setPalette] = useState([]);
  const [locations, setLocations] = useState([]);
  const [depotsList, setDepots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchDepots = async () => {
    try {
      if (!product.societe) return;
      const response = await axios.get('http://10.10.0.20:5000/api/v1/db/depots', {
        params: { societe: product.societe },
      });
      setDepots(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des dépôts.');
      console.error('Erreur lors du chargement des dépôts', err);
    }
  };

  const fetchProductData = async (field, value) => {
    setSearching(true);
    setError(null);

    try {
      const response = await axios.get('http://10.10.0.20:5000/api/v1/db/search-product', {
        params: { societe: product.societe, [field]: value },
      });

      const { ART_COD, ART_DES, FOU_NOM, ART_EAN } = response.data;

      setProduct(prevProduct => ({
        ...prevProduct,
        ART_COD: field === 'ART_EAN' ? ART_COD || '' : prevProduct.ART_COD,
        ART_DES: ART_DES || '',
        FOU_NOM: FOU_NOM || '',
        ART_EAN: field === 'ART_COD' ? ART_EAN || '' : prevProduct.ART_EAN,
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Convertir la valeur en majuscules automatiquement
    const uppercasedValue = value.toUpperCase();
   if (name === 'reference') {
      setReference(uppercasedValue);
    } else if (name === 'referencefour') {
      setReferencefour(uppercasedValue);
    } else if (name === 'designation') {
      setDesignation(uppercasedValue);
    } else if (name === 'codeBarre') {
      setCodeBarre(uppercasedValue);
    } else if (name === 'palettes') {
      setPalettes(uppercasedValue);
    } else if (name === 'locations') {
      setLocations(uppercasedValue);
    }

    setProduct(prevProduct => {
      const updatedProduct = { ...prevProduct, [name]: value };

      if (name === 'ART_EAN') {
        clearTimeout(searchTimeout);
        setSearchTimeout(
          setTimeout(() => {
            if (value.length === 13) {
              fetchProductData('ART_EAN', value);
            }
          }, 600)
        );
      }

      if (name === 'ART_COD' && !updatedProduct.ART_DES) {
        fetchProductData('ART_COD', value);
      }

      return updatedProduct;
    });
  };

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

    const newProduct = {
      ART_COD: product.ART_COD,
      ART_EAN: product.ART_EAN,
      ART_DES: product.ART_DES,
      quantity: product.quantity,
      ART_PAL: product.ART_PAL,
      ART_LOC: product.ART_LOC,
    };

    setProductsList(prevList => [...prevList, newProduct]);

    // Réinitialisation uniquement des champs produit
    const { societe, depots, ART_PAL, ART_LOC } = product;
    setProduct({
      societe,
      depots,
      ART_PAL,
      ART_LOC,
      ART_COD: '',
      ART_EAN: '',
      ART_DES: '',
      quantity: '',
    });
  };

  const handleEdit = (index) => {
    const productToEdit = productsList[index];
    setProduct(prev => ({
      ...prev,
      ART_COD: productToEdit.ART_COD,
      ART_EAN: productToEdit.ART_EAN,
      ART_DES: productToEdit.ART_DES,
      quantity: productToEdit.quantity,
    }));
    setProductsList(prevList => prevList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productsList.length) {
      alert('Aucun produit à ajouter.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        'http://10.10.0.20:5000/api/v1/stock/add-product',
        {
          societe: product.societe,
          depot: product.depots,
          products: productsList,
        }
      );

      onAddProduct(response.data);
      
      // Réinitialisation complète uniquement après la validation
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Empêche la soumission du formulaire
      // handleAddProduct(); // Ajoute le produit au tableau
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {searching && <p>Recherche en cours...</p>}

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
            <option value="">{!depotsList.length ? 'Chargement...' : 'Choisir un dépôt'}</option>
            {depotsList?.map((depot) => (
              <option key={depot} value={depot}>
                {depot}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 md:w-1/2">
          <label className="block text-sm font-medium text-gray-700">Palette (ART_PAL) :</label>
          <input
            type="text"
            name="ART_PAL"
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
            value={product.ART_LOC}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Code Barre (ART_EAN) :</label>
        <input
          type="text"
          name="ART_EAN"
          value={product.ART_EAN}
          onChange={handleChange}
          onKeyDown={handleKeyDown} // Ajoutez cette ligne
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Référence (ART_COD) :</label>
        <input
          type="text"
          name="ART_COD"
          value={product.ART_COD}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description (ART_DES) :</label>
        <input
          type="text"
          name="ART_DES"
          value={product.ART_DES || ''}
          readOnly
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Quantité :</label>
        <input
          type="number"
          name="quantity"
          value={product.quantity}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleAddProduct}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          Ajouter le produit
        </button>

        {/* <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={loading || productsList.length === 0}
        >
          Valider tous les produits
        </button> */}
      </div>

      {productsList.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium">Produits ajoutés ({productsList.length}):</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Palette</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emplacement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productsList.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{item.ART_COD}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.ART_DES}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.ART_PAL}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.ART_LOC}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        type="button"
                        onClick={() => handleEdit(index)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Boutons */}
      <div className="flex space-x-4">
        {/* <button
          type="button"
          onClick={handleAddProduct}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          Ajouter le produit
        </button> */}
        
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={loading || productsList.length === 0}
        >
          Valider tous les produits
        </button>
      </div>
    </form>
  );
}

export default ProductForm;