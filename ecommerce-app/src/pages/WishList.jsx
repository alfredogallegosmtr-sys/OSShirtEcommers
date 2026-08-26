import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard/ProductCard";
import Button from "../components/common/Button";
import Icon from "../components/common/Icon/Icon";
import Loading from "../components/common/Loading/Loading";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import { getWishlist, removeFromWishlist } from "../services/wishlistService";
import "./WishList.css";

export default function WishList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const wishlist = await getWishlist();
        if (!cancelled) setProducts(wishlist.products || []);
      } catch (err) {
        if (!cancelled) setError("No se pudo cargar tu lista de favoritos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRemove = async (productId) => {
    try {
      const wishlist = await removeFromWishlist(productId);
      setProducts(wishlist.products || []);
    } catch (err) {
      setError("No se pudo quitar el producto de favoritos.");
    }
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <Loading>Cargando tu lista de favoritos...</Loading>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-page">
        <ErrorMessage>{error}</ErrorMessage>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="wishlist-page wishlist-empty">
        <Icon name="heart" size={48} />
        <h1>Tu lista de favoritos está vacía</h1>
        <p>
          Marca productos como favoritos desde su página de detalle para
          encontrarlos fácilmente después.
        </p>
        <Link to="/" className="wishlist-link">
          <Button>Descubrir productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <p className="eyebrow">Tus favoritos</p>
        <h1>Mi lista de favoritos</h1>
        <p className="muted">
          {products.length === 1
            ? "Tienes 1 producto guardado"
            : `Tienes ${products.length} productos guardados`}
        </p>
      </div>
      <div className="wishlist-grid">
        {products.map((product) => (
          <div key={product._id} className="wishlist-item">
            <ProductCard product={product} orientation="vertical" />
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleRemove(product._id)}
            >
              Quitar de favoritos
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
