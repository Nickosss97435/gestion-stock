import ExportButton from '../components/ExportButton';
import TransfertArticles from '../components/TransfertArticles';
import ScannerListe from '../components/ScannerListe';

const Transfer = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Transfert d'article</h1>
      <TransfertArticles />
      {/* <h1 className="text-2xl font-bold mb-4">Liste Produits</h1> */}
      {/* <ScannerListe /> */}
      {/* <h1 className="text-2xl font-bold mb-4">Export</h1>
      <ExportButton /> */}
    </div>
  );
};

export default Transfer;