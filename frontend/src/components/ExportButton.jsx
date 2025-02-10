import axios from 'axios';

const ExportButton = () => {
  const handleExport = async () => {
    try {
      const response = await axios.post('http://10.10.0.20:5000/api/v1/export-excel', {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Erreur lors de l\'export', error);
    }
  };

  return (
    <button onClick={handleExport} className="bg-blue-500 text-white p-2 rounded">
      Exporter en Excel
    </button>
  );
};

export default ExportButton;