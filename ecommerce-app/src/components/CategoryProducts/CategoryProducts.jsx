import { Link } from "react-router-dom";
import Breadcrumb from "../../layout/Breadcrumb/Breadcrumb";
import { getProductsByCategoryAndChildren } from "../../services/categoryService";
import ProductCard from "../ProductCard/ProductCard";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Loading from "../common/Loading/Loading";
import useFetch from "../../hooks/useFetch";
import "./CategoryProducts.css";

export default function CategoryProducts({ categoryId }) {
  const { data, loading, error } = useFetch(
    () => getProductsByCategoryAndChildren(categoryId, { limit: 50 }),
    [categoryId]
  );
  const category = data?.category ?? null;
  const products = data?.products ?? [];

  if (loading) {
    return (
      <div className="category-products-root">
        <Loading>Cargando categoría y productos...</Loading>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="category-products-root">
        <ErrorMessage>
          Categoría no encontrada
          <p className="category-products-muted">
            Vuelve al <Link to="/">inicio</Link> o explora nuestras categorías
            destacadas.
          </p>
        </ErrorMessage>
      </div>
    );
  }

  return (
    <div className="category-products-root">
      <Breadcrumb categories={category} />
      <div className="category-products-container">
        <div className="category-products-header">
          <div className="category-products-title">
            <h1 className="category-products-h1">
              {category.parentCategory
                ? `${category.parentCategory.name}: ${category.name}`
                : category.name}
            </h1>
            {category.description && (
              <p className="category-products-muted">{category.description}</p>
            )}
          </div>
        </div>
        {products.length > 0 ? (
          <div className="category-products-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                orientation="vertical"
                className="card"
              />
            ))}
          </div>
        ) : (
          <ErrorMessage>
            No se encontraron productos
            <p className="category-products-muted">
              No hay productos disponibles en esta categoría por el momento.
            </p>
          </ErrorMessage>
        )}
      </div>
    </div>
  );
}
