import ExportButton from '../components/ExportButton';
import PaletteSortie from '../components/PaletteSortie';

const Sortie = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Sortie d'articles</h1>
      <PaletteSortie />
      {/* <h1 className="text-2xl font-bold mb-4">Export</h1>
      <ExportButton /> */}
    </div>
  );
};

export default Sortie;