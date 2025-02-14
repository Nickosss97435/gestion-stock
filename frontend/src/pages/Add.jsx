import AddStock from '../components/AddStock';

const Enter = () => {
  const handleAddProduct = (product) => {
    console.log('Produit ajouté:', product);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Entrée de produits</h1>
      <AddStock onAddProduct={handleAddProduct} />
    </div>
  );
};

export default Enter;