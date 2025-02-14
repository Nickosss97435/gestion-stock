import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaletteSortie = () => {
    const [fromPalette, setFromPalette] = useState('');
    const [barcode, setBarcode] = useState('');
    const [artCod, setArtCod] = useState('');
    const [quantity, setQuantity] = useState('');
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [searching, setSearching] = useState(false);
    const [depotsList, setDepots] = useState([]);
    const [societe, setSociete] = useState('');
    const [depot, setDepot] = useState('');
    const [productInfo, setProductInfo] = useState(null);

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

    useEffect(() => {
        fetchDepots();
    }, [societe]);

    const fetchProductData = async (field, value) => {
        if (!societe || !depot) {
            setError('Veuillez sélectionner une société et un dépôt.');
            return;
        }

        if (!value.trim()) return;

        setSearching(true);
        setError(null);

        try {
            const response = await axios.get('http://10.10.0.20:5000/api/v1/stock/search-product', {
                params: { societe, depot, [field]: value },
            });

            console.log('Réponse de l\'API:', response.data);

            const { ART_COD, ART_DES, FOU_NOM, ART_EAN, stock } = response.data;

            if (!stock || typeof stock !== 'object' || !stock[depot]) {
                throw new Error(`Stock non disponible pour ce produit dans le dépôt ${depot}.`);
            }

            if (!fromPalette) {
                throw new Error('La palette source n\'est pas définie.');
            }

            const availableStock = parseInt(stock[depot] || 0);

            if (availableStock < 1) {
                throw new Error(`Le produit ${ART_COD} n'est pas disponible dans le dépôt sélectionné.`);
            }

            setArtCod(ART_COD);
            setBarcode(ART_EAN);
            setProductInfo({ ART_COD, ART_DES, FOU_NOM, ART_EAN, stock });
            document.querySelector('input[name="quantity"]').focus();

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

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'fromPalette') {
            setFromPalette(value);
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

    const handleAddProduct = () => {
        if (!societe || !depot || !fromPalette || !barcode || !quantity) {
            setError('Tous les champs sont requis.');
            return;
        }

        if (!productInfo) {
            setError('Veuillez d\'abord rechercher le produit.');
            return;
        }

        const availableStock = parseInt(productInfo.stock[depot] || 0);
        if (parseInt(quantity) > availableStock) {
            setError(`Quantité demandée (${quantity}) supérieure au stock disponible (${availableStock}).`);
            return;
        }

        const productInList = products.find(
            (product) => product.ART_COD === artCod && product.ART_PAL === fromPalette
        );

        if (productInList) {
            setError(`Le produit ${artCod} est déjà dans la liste.`);
            return;
        }

        setProducts((prevProducts) => [
            ...prevProducts,
            {
                ART_COD: artCod,
                ART_EAN: barcode,
                ART_PAL: fromPalette,
                quantity: parseInt(quantity, 10),
            },
        ]);

        setBarcode('');
        setArtCod('');
        setQuantity('');
    };

    const handleTransfer = async () => {
        if (!products.length) {
            setError('Aucun produit à transférer.');
            return;
        }

        try {
            // Prepare the data for the request
            const transferData = {
                societe,
                depot,
                fromPalette,
                products: products.map(({ ART_COD, ART_EAN, ART_PAL, quantity }) => ({
                    ART_COD,
                    ART_EAN,
                    ART_PAL,
                    quantity,
                })),
            };

            console.log('Données envoyées :', transferData);

            // Send the transfer request
            const response = await axios.post(
                'http://10.10.0.20:5000/api/v1/stock/out-product',
                transferData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(response.data);
            alert('Transfert réussi.');

            // Reset the form
            setFromPalette('');
            setProducts([]);
            setError(null);

        } catch (error) {
            console.error('Erreur lors du transfert', error);
            setError(error.message || 'Une erreur est survenue lors du transfert.');
            alert(error.message || 'Une erreur est survenue lors du transfert.');
        }
    };

    return (
        <div className="space-y-4">
            {searching && <p>Recherche en cours...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

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

            <div>
                <label className="block text-sm font-medium text-gray-700">Palette source :</label>
                <input
                    type="text"
                    name="fromPalette"
                    placeholder="Code barre Palette source"
                    value={fromPalette}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
            </div>

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

            <button
                type="button"
                onClick={handleAddProduct}
                className="bg-blue-900 text-white p-2 rounded-md hover:bg-blue-800"
            >
                Ajouter
            </button>

            {products.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700">Produits à transférer :</h3>
                    <table className="min-w-full divide-y divide-gray-200 mt-2">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Palette Source</th>
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
                                    <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            className="text-red-600 hover:text-red-900"
                                            onClick={() => setProducts(products.filter((_, i) => i !== index))}
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

            <button
                type="button"
                onClick={handleTransfer}
                className="bg-green-700 text-white p-2 rounded-md hover:bg-green-500"
            >
                Sortir
            </button>
        </div>
    );
};

export default PaletteSortie;
