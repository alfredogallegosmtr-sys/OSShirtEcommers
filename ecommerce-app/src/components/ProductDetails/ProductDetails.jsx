import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import Breadcrumb from "../../layout/Breadcrumb/Breadcrumb";
import { getProductById } from "../../services/productsService";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../../services/wishlistService";
import Badge from "../common/Badge";
import Button from "../common/Button";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
// import Loading from "../common/Loading/Loading";
import useFetch from "../../hooks/useFetch";
import "./ProductDetails.css";

export default function ProductDetails({ productId }) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsInWishlist(false);
      return;
    }
    let cancelled = false;
    getWishlist()
      .then((wishlist) => {
        if (cancelled) return;
        const inList = (wishlist.products || []).some(
          (item) => (item._id || item) === productId
        );
        setIsInWishlist(inList);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, productId]);

  const handleToggleWishlist = async () => {
    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist(productId);
        setIsInWishlist(false);
      } else {
        await addToWishlist(productId);
        setIsInWishlist(true);
      }
    } catch (err) {
      // silencioso: no bloquea el resto de la página por un fallo de wishlist
    } finally {
      setWishlistLoading(false);
    }
  };

  const { data: product, loading, error } = useFetch(
    () => getProductById(productId),
    [productId]
  );

  const handleAddToCart = () => {
    if (product) addItem(product, 1);
  };

  if (loading) return <ProductDetailSkeleton />;

  if (error === "NOT_FOUND") {
    return (
      <div className="product-details-container">
        <ErrorMessage>
          <h2>Producto no encontrado</h2>
          <p className="muted">
            Este producto no existe o fue retirado del catálogo.
            <Link to="/">Volver al catálogo</Link>
          </p>
        </ErrorMessage>
      </div>
    );
  }

  if (error === "NETWORK" || error === "TIMEOUT") {
    return (
      <div className="product-details-container">
        <ErrorMessage>
          <h3>No pudimos cargar este producto</h3>
          <p className="muted">
            Puede ser tu conexión a internet o que nuestro servidor no esté
            respondiendo en este momento. Tu carrito y tu sesión no se
            vieron afectados.
          </p>
          <Button onClick={() => window.location.reload()}>
            Intentar de nuevo
          </Button>
        </ErrorMessage>
      </div>
    );
  }

  if (error === "SERVER_ERROR") {
    return (
      <div className="product-details-container">
        <ErrorMessage>
          <h3>No pudimos cargar este producto</h3>
          <p className="muted">
            Algo salió mal de nuestro lado. Tu carrito y tu sesión no se
            vieron afectados — intenta de nuevo en unos minutos.
          </p>
          <Button onClick={() => window.location.reload()}>
            Intentar de nuevo
          </Button>
        </ErrorMessage>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-details-container">
        <ErrorMessage>
          <h3>No pudimos cargar este producto</h3>
          <p className="muted">
            Ocurrió un error inesperado. Tu carrito y tu sesión no se vieron
            afectados — intenta de nuevo.
          </p>
          <Button onClick={() => window.location.reload()}>
            Intentar de nuevo
          </Button>
        </ErrorMessage>
      </div>
    );
  }

  if (!product) return null;

  const { name, description, price, stock, imageURL, images, category } = product;
  const productImage = imageURL || images?.[0] || "/img/products/placeholder.svg";
  const stockBadge = stock > 0 ? "success" : "error";
  const stockLabel = stock > 0 ? "En stock" : "Agotado";

  return (
    <div className="product-details-container">
      <Breadcrumb categories={category} />
      <div className="product-details-main">
        <div className="product-details-image">
          <img
            src={productImage}
            alt={name}
            onError={(event) => {
              event.target.src = "/img/products/placeholder.svg";
            }}
          />
        </div>
        <div className="product-details-info">
          <div className="product-details-title">
            <h1 className="h1">{name}</h1>
            {category?.name && (
              <span className="product-details-category">{category?.name}</span>
            )}
          </div>
          <p className="product-details-description">{description}</p>
          <div className="product-details-stock">
            <Badge text={stockLabel} variant={stockBadge} />
            {stock > 0 && (
              <span className="muted">{stock} unidades disponibles</span>
            )}
          </div>
          <div className="product-details-price">${price}</div>
          <div className="product-details-actions">
            <Button
              variant="primary"
              size="lg"
              disabled={stock === 0}
              onClick={handleAddToCart}
            >
              Agregar al carrito
            </Button>
            <Link to="/cart" className="btn btn-outline btn-lg">
              Ver carrito
            </Link>
            {isAuthenticated && (
              <Button
                variant="secondary"
                size="lg"
                disabled={wishlistLoading}
                onClick={handleToggleWishlist}
              >
                {isInWishlist ? "♥ En favoritos" : "♡ Agregar a favoritos"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="max-w-2x1 mx-auto p-6 animate-pulse">
      <div className="bg-gray-200 h-80 mb-4 rounded"></div>
      <div className="bg-gray-200 h-8 w-3/4 mb-2 rounded"></div>
      <div className="bg-gray-200 h-6 w-1/4 rounded"></div>
    </div>
  );
}
