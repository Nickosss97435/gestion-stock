import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

const ScannerListe = ({ onScan }) => {
  const videoRef = useRef(null);
  const {
    currentItem,
    handleScan,
    handleError,
    handleSubmit,
    handleChange,
    error,
    success,
    editingIndex,
    setError,
    setSuccess,
    setCurrentItem,
    loading,
  } = useScannerStore();

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    const startDecoding = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;

        const loop = async () => {
          try {
            const result = await codeReader.decodeFromVideoElement(videoRef.current);
            if (result) {
              onScan(result.getText());
            }
          } catch (error) {
            console.error('Erreur lors du décodage :', error);
          } finally {
            requestAnimationFrame(loop);
          }
        };

        loop();
      } catch (error) {
        console.error('Erreur lors du démarrage du scan :', error);
      }
    };

    if (scanning) {
      startDecoding();
    }

    return () => {
      codeReader.reset();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onScan, scanning]);

  if (loading) {
    return <div className="text-red-500">Chargement...</div>;
  }

  if (!currentItem) {
    return <div className="text-red-500">Aucun article trouvé.</div>;
  }

  const handleSearch = () => {
    const { barcode, itemCode } = currentItem;
    if (!barcode && !itemCode) {
      setError('Veuillez entrer un code barre ou un code article pour rechercher.');
      setTimeout(() => setError(''), 2000);
      return;
    }

    const foundItem = data.find((item) => {
      if (barcode) {
        return String(item.ART_EAN).trim() === String(barcode).trim();
      }
      if (itemCode) {
        return String(item.ART_COD).trim() === String(itemCode).trim();
      }
      return false;
    });

    if (foundItem) {
      setCurrentItem({
        barcode: String(foundItem.ART_EAN),
        itemCode: foundItem.ART_COD,
        itemDes: foundItem.ART_DES,
        itemUna: foundItem.ART_UNA_L,
      });
      setSuccess('Article trouvé.');
      setTimeout(() => setSuccess(''), 2000);
    } else {
      setError('Aucun article trouvé.');
      setTimeout(() => setError(''), 2000);
    }
  };

  return (
    <>
      <video ref={videoRef} />
      <div className="bg-white dark:bg-blue-800/70 rounded-lg shadow-lg p-6 mb-6">
        {/* <h2 className="text-blue-900 dark:text-white text-2xl font-bold mb-4">Inventaire en cours</h2> */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-white">
                Code Barre
              </label>
              <input
                id="barcode"
                name="barcode"
                type="text"
                autoComplete="off"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={currentItem.barcode || ''} // Utilisez une valeur par défaut
                onChange={handleChange}
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="itemCode" className="block text-sm font-medium text-gray-700 dark:text-white">
                Code Article
              </label>
              <input
                id="itemCode"
                name="itemCode"
                type="text"
                autoComplete="off"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={currentItem.itemCode || ''} // Utilisez une valeur par défaut
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="itemDes" className="block text-sm font-medium text-gray-700 dark:text-white">
                Description Article
              </label>
              <p id="itemDes" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                {currentItem.itemDes || 'Non disponible'}
              </p>
            </div>
            <div>
              <label htmlFor="itemUna" className="block text-sm font-medium text-gray-700 dark:text-white">
                Unité de mesure
              </label>
              <p id="itemUna" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                {currentItem.itemUna || 'Non disponible'}
              </p>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSearch}
                className="ml-2 bg-green-400 border border-green-700 text-green-900 py-2 px-4 rounded-md hover:bg-green-700 hover:text-green-100"
              >
                Rechercher
              </button>
            </div>
          </div>
          <div className="pt-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="mt-4 w-full bg-blue-900 text-white dark:bg-white dark:text-blue-900 py-2 px-4 rounded-md hover:bg-blue-800"
          >
            {editingIndex !== null ? 'Modifier' : 'Ajouter'}
          </button>
        </form>
      </div>
    </>
  );
};

export default ScannerListe;