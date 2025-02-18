import SearchStock from "../components/SearchStock";
import ExportButton from "../components/ExportButton"

const Home = () => {
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4"></h1>
      <SearchStock />
      {/* <h1 className="text-2xl font-bold mb-4">Export</h1>
      <ExportButton /> */}
    </div>
  );
};

export default Home;