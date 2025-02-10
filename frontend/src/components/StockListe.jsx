import React, { useEffect, useState } from 'react';
import axios from 'axios';

function StockListe() {
  const [materiaux, setMateriaux] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // États pour les filtres
  const [societe, setSociete] = useState('EPR');
  const [depot, setDepot] = useState('');
  const [reference, setReference] = useState('');
  const [referencefour, setReferencefour] = useState('');
  const [designation, setDesignation] = useState('');
  const [codeBarre, setCodeBarre] = useState('');
  const [palettes, setPalettes] = useState(''); // Champ pour Palette
  const [locations, setLocations] = useState(''); // Champ pour Emplacement

  // État pour la liste des dépôts disponibles
  const [depots, setDepots] = useState([]);

  // État pour le tri
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  // Récupérer la liste des dépôts disponibles
  useEffect(() => {
    const fetchDepots = async () => {
      try {
        const response = await axios.get('http://10.10.0.20:5000/api/v1/stock/depots', {
          params: { societe },
        });
        setDepots(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des dépôts :', error);
        setError('Une erreur est survenue lors du chargement des dépôts.');
      }
    };

    fetchDepots();
  }, [societe]);

  // Fonction pour récupérer les matériaux filtrés
  const fetchMateriaux = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://10.10.0.20:5000/api/v1/stock', {
        params: {
          societe,
          depot,
          reference,
          referencefour,
          designation,
          codeBarre,
          palettes,
          locations,
        },
      });

      setMateriaux(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des matériaux :', error);
      setError('Une erreur est survenue lors du chargement des stocks.');
    } finally {
      setLoading(false);
    }
  };

  // Soumettre le formulaire de filtrage
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchMateriaux();
  };

  // Gérer le tri
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  // Appliquer le tri aux matériaux
  const sortedMateriaux =
    materiaux &&
    materiaux.stock &&
    Array.isArray(materiaux.stock)
      ? materiaux.stock.slice().sort((a, b) => {
          if (!sortColumn) return 0; // Pas de tri
          const valueA =
            sortColumn === 'totalValue'
              ? parseFloat(a[sortColumn])
              : a[sortColumn];
          const valueB =
            sortColumn === 'totalValue'
              ? parseFloat(b[sortColumn])
              : b[sortColumn];

          if (typeof valueA === 'string' && typeof valueB === 'string') {
            return sortOrder === 'asc'
              ? valueA.localeCompare(valueB)
              : valueB.localeCompare(valueA);
          }

          return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
        })
      : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Recherche d'Articles</h1>

      {/* Formulaire de filtrage */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ligne 1 : Société et Dépôt */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 md:w-1/2">
            <label className="block text-sm font-medium text-gray-700">Société :</label>
            <select
              value={societe}
              onChange={(e) => setSociete(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="EPR">Entreprise EPR</option>
              <option value="GMR">Entreprise GMR</option>
              <option value="CPR">Entreprise CPR</option>
            </select>
          </div>
          <div className="flex-1 md:w-1/2">
            <label className="block text-sm font-medium text-gray-700">Dépôt :</label>
            <select
              value={depot}
              onChange={(e) => setDepot(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Tous les dépôts</option>
              {depots.map((depotItem) => (
                <option key={depotItem} value={depotItem}>
                  {depotItem}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ligne 2 : Autres champs de recherche */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Référence :</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Filtrer par référence"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Désignation :</label>
          <input
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Filtrer par désignation"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Code-barres :</label>
          <input
            type="text"
            value={codeBarre}
            onChange={(e) => setCodeBarre(e.target.value)}
            placeholder="Filtrer par code-barres"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Palette (ART_PAL) :</label>
          <input
            type="text"
            value={palettes}
            onChange={(e) => setPalettes(e.target.value)}
            placeholder="N° de Palette"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Emplacement (ART_LOC) :</label>
          <input
            type="text"
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
            placeholder="Filtrer par emplacement"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        >
          Valider
        </button>
      </form>

      {/* Affichage des résultats */}
      {loading && <p className="text-gray-600">Chargement des articles...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {materiaux && (
        <>
          <p className="text-gray-700 mb-4">
            Résultats : {materiaux.summary.totalProducts} produits trouvés | Quantité totale en stock :{' '}
            {materiaux.summary.totalQuantity} | Poid totale en stock : {materiaux.summary.totalStockValue} Kg
          </p>
          {/* Conteneur pour le tableau avec défilement horizontal */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort('id')}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" // Centrer les en-têtes
                  >
                    Code {sortColumn === 'id' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('nom')}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" // Centrer les en-têtes
                  >
                    Nom {sortColumn === 'nom' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('FOU_NOM')}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" // Centrer les en-têtes
                  >
                    Fournisseur {sortColumn === 'FOU_NOM' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('ean')}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" // Centrer les en-têtes
                  >
                    EAN {sortColumn === 'ean' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('stock')}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" // Centrer les en-têtes
                  >
                    Stock {sortColumn === 'stock' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('ART_PAL')}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" // Centrer les en-têtes
                  >
                    Palette {sortColumn === 'ART_PAL' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    onClick={() => handleSort('ART_LOC')}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" // Centrer les en-têtes
                  >
                    Emplacement {sortColumn === 'ART_LOC' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedMateriaux &&
                  sortedMateriaux.map((mat) => (
                    <tr key={mat.id || mat.ART_COD} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{mat.id || mat.ART_COD}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{mat.nom || mat.ART_DES}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{mat.referencefour || mat.FOU_NOM}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{mat.ean || mat.ART_EAN}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">{mat.stock || 0}</td> {/* Centrer les données de stock */}
                      <td className="px-6 py-4 whitespace-nowrap">{mat.ART_PAL || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{mat.ART_LOC || ''}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {!loading && !error && !materiaux && (
        <p className="text-gray-600">Aucun résultat trouvé.</p>
      )}
    </div>
  );
}

export default StockListe;