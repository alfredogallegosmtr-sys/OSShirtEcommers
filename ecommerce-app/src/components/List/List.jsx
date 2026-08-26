import { useEffect, useRef } from "react";
import ProductCard from "../ProductCard/ProductCard";
import Icon from "../common/Icon/Icon";
import "./List.css";

// Cuántas veces se repite el set de productos para que el loop infinito
// nunca muestre un borde real (mientras más copias, más "colchón" de scroll).
const CAROUSEL_COPIES = 4;
// Tiempo de espera entre cada avance automático del carrusel.
const CAROUSEL_STEP_INTERVAL = 3000;

export default function List({
  products = [],
  title = "Nuestros Productos",
  layout = "grid",
}) {
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef(null);

  const pauseAutoScroll = () => {
    pausedRef.current = true;
    clearTimeout(resumeTimeoutRef.current);
  };

  const resumeAutoScrollSoon = () => {
    clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, CAROUSEL_STEP_INTERVAL);
  };

  const getStepAmount = (track) => {
    const card = track.querySelector(".list-carousel__item");
    if (!card) return track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.offsetWidth + gap;
  };

  // Antes de avanzar, si ya estamos cerca del borde del "colchón" de copias,
  // reubicamos sin animación al punto equivalente de una copia vecina para
  // que el salto nunca sea visible.
  const correctWrap = (track, setWidth) => {
    if (track.scrollLeft >= setWidth * (CAROUSEL_COPIES - 1)) {
      track.scrollLeft -= setWidth;
    } else if (track.scrollLeft <= 0) {
      track.scrollLeft += setWidth;
    }
  };

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    pauseAutoScroll();
    const setWidth = track.scrollWidth / CAROUSEL_COPIES;
    correctWrap(track, setWidth);
    track.scrollBy({ left: direction * getStepAmount(track), behavior: "smooth" });
    resumeAutoScrollSoon();
  };

  // Auto-avance infinito: cada CAROUSEL_STEP_INTERVAL ms se desliza un
  // producto hacia adelante. El track contiene varias copias del mismo set
  // de productos; al acercarse al final del "colchón" de copias, se reubica
  // sin animación al punto equivalente de una copia anterior, dando la
  // ilusión de un carrusel sin fin.
  useEffect(() => {
    if (layout !== "carousel" || products.length === 0) return;
    const track = trackRef.current;
    if (!track) return;

    const setWidth = track.scrollWidth / CAROUSEL_COPIES;
    track.scrollLeft = setWidth;

    const intervalId = setInterval(() => {
      if (pausedRef.current) return;
      correctWrap(track, setWidth);
      track.scrollBy({ left: getStepAmount(track), behavior: "smooth" });
    }, CAROUSEL_STEP_INTERVAL);

    return () => clearInterval(intervalId);
  }, [layout, products.length]);

  if (layout === "carousel") {
    const loopedProducts = Array.from({ length: CAROUSEL_COPIES }).flatMap(
      (_, copyIndex) =>
        products.map((product) => ({ product, key: `${product._id}-${copyIndex}` }))
    );

    return (
      <div className="list-container list-container--carousel">
        <div className="list-header">
          <h1 className="list-title">{title}</h1>
        </div>
        <div className="list-carousel">
          <button
            type="button"
            className="list-carousel__btn list-carousel__btn--prev"
            onClick={() => scrollByCard(-1)}
            aria-label="Producto anterior"
          >
            <Icon name="chevronLeft" size={20} />
          </button>

          <div
            className="list-carousel__track"
            ref={trackRef}
            onMouseEnter={pauseAutoScroll}
            onMouseLeave={() => {
              pausedRef.current = false;
            }}
          >
            {loopedProducts.map(({ product, key }) => (
              <ProductCard
                key={key}
                product={product}
                orientation="vertical"
                className="list-carousel__item"
              />
            ))}
          </div>

          <button
            type="button"
            className="list-carousel__btn list-carousel__btn--next"
            onClick={() => scrollByCard(1)}
            aria-label="Siguiente producto"
          >
            <Icon name="chevronRight" size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="list-container">
      <div className="list-header">
        <h1 className="list-title">{title}</h1>
      </div>
      {layout === "grid" ? (
        <div className="list-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              orientation="vertical"
            />
          ))}
        </div>
      ) : (
        <div className="list-vertical">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              orientation="horizontal"
            />
          ))}
        </div>
      )}
    </div>
  );
};