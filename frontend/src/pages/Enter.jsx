import ProductForm from '../components/ProductForm';

const Enter = () => {
  const handleAddProduct = (product) => {
    console.log('Produit ajouté:', product);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Entrée de produits</h1>
      <ProductForm onAddProduct={handleAddProduct} />
    </div>
  );
};

export default Enter;