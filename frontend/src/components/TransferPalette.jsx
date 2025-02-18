import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TransferPalette = () => {
  const [societe, setSociete] = useState(''); // Société sélectionnée
  const [depot, setDepot] = useState(''); // Dépôt sélectionné
  const [fromPalette, setFromPalette] = useState(''); // Palette source
  const [currentLocation, setCurrentLocation] = useState(''); // Emplacement actuel
  const [toLocation, setToLocation] = useState(''); // Emplacement de destination
  const [error, setError] = useState(null); // Gestion des erreurs
  const [loading, setLoading] = useState(false); // Indicateur de chargement
  const [palettes, setPalettes] = useState([]); // Liste des palettes disponibles
  const [locations, setLocations] = useState([]); // Liste des emplacements disponibles
  const [depots, setDepots] = useState([]); // Liste des dépôts disponibles

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
    if (societe) {
      fetchDepots();
    }
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

  // Récupérer la liste des emplacements disponibles
  const fetchLocations = async () => {
    try {
      if (!societe || !depot) return;
      const response = await axios.get('http://10.10.0.20:5000/api/v1/stock/locations', {
        params: { societe, depot },
      });
      setLocations(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des emplacements.');
      console.error('Erreur lors du chargement des emplacements', err);
    }
  };

  useEffect(() => {
    if (societe && depot) {
      fetchPalettes();
      fetchLocations();
    }
  }, [societe, depot]);

  // Récupérer l'emplacement actuel de la palette
  const fetchCurrentLocation = async (palette) => {
    try {
      if (!societe || !depot || !palette) return;
      const response = await axios.get('http://10.10.0.20:5000/api/v1/stock/search-palette-location', {
        params: { societe, depot, ART_PAL: palette },
      });
      setCurrentLocation(response.data.location || '');
    } catch (err) {
      setError('Palette introuvable ou emplacement non défini.');
      console.error('Erreur lors de la récupération de l\'emplacement', err);
    }
  };

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'societe') {
      setSociete(value);
      setDepot('');
      setCurrentLocation('');
      setFromPalette('');
      setToLocation('');
    } else if (name === 'depot') {
      setDepot(value);
      setCurrentLocation('');
      setFromPalette('');
      setToLocation('');
    } else if (name === 'fromPalette') {
      setFromPalette(value);
      fetchCurrentLocation(value);
    } else if (name === 'toLocation') {
      setToLocation(value);
    }
  };

  // Valider le transfert d'emplacement
  const handleTransfer = async () => {
    if (!societe || !depot || !fromPalette || !toLocation) {
      alert('Tous les champs sont requis.');
      return;
    }

    if (currentLocation === toLocation) {
      alert('L\'emplacement de destination ne peut pas être identique à l\'emplacement actuel.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        'http://10.10.0.20:5000/api/v1/stock/transfer-palette-location',
        {
          societe,
          depot,
          fromPalette,
          toLocation,
        }
      );

      console.log(response.data);
      alert('Transfert d\'emplacement réussi.');

      // Réinitialiser le formulaire après validation
      setCurrentLocation('');
      setFromPalette('');
      setToLocation('');
    } catch (error) {
      console.error('Erreur lors du transfert d\'emplacement', error);
      alert(error.response?.data?.error || 'Une erreur est survenue lors du transfert.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Affichage d'un message de chargement */}
      {loading && <p>Transfert en cours...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Sélection de la société et du dépôt */}
      <div>
        <label>Société :</label>
        <select
          value={societe}
          onChange={handleChange}
          name="societe"
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
          onChange={handleChange}
          name="depot"
          disabled={!societe}
          className="text-blue-900 w-full p-2 border rounded-md"
        >
          {!societe ? (
            <option>Choisir une société d'abord</option>
          ) : (
            <option>Choisir un dépôt</option>
          )}
          {depots.map((depotItem) => (
            <option key={depotItem}>{depotItem}</option>
          ))}
        </select>
      </div>

      {/* Sélection de la palette source */}
      <div>
        <label>Palette source :</label>
        <select
          value={fromPalette}
          onChange={handleChange}
          name="fromPalette"
          disabled={!depot}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        >
          {!depot ? (
            <option>Choisir un dépôt d'abord</option>
          ) : (
            <option>Choisir une palette</option>
          )}
          {palettes.map((palette) => (
            <option key={palette}>{palette}</option>
          ))}
        </select>

        <label>Emplacement actuel :</label>
        <input
          type="text"
          value={currentLocation}
          readOnly
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
        />
      </div>

      {/* Saisie de l'emplacement de destination */}
      <div>
        <label>Emplacement de destination :</label>
        <input
          type="text"
          value={toLocation}
          onChange={handleChange}
          name="toLocation"
          disabled={!depot}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Bouton pour valider le transfert */}
      <button
        onClick={handleTransfer}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md"
        disabled={!fromPalette || !toLocation}
      >
        Transférer l'emplacement
      </button>
    </div>
  );
};

export default TransferPalette;