import ExportButton from '../components/ExportButton';
import PaletteTransfert from '../components/PaletteTransfert';
import ScannerListe from '../components/ScannerListe';

const Transfer = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Transfert d'article</h1>
      <PaletteTransfert />
      {/* <h1 className="text-2xl font-bold mb-4">Liste Produits</h1> */}
      {/* <ScannerListe /> */}
      {/* <h1 className="text-2xl font-bold mb-4">Export</h1>
      <ExportButton /> */}
    </div>
  );
};

export default Transfer;