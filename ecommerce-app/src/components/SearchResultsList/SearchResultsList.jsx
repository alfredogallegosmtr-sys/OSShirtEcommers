import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchProducts } from "../../services/productsService";
import List from "../List/List";
import useFetch from "../../hooks/useFetch";
import "./SearchResultsList.css";

export default function SearchResultsList() {
  const [searchParams] = useSearchParams();
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const query = (searchParams.get("q") || "").trim();

  const { data, loading, error } = useFetch(
    () => searchProducts({ q: query || undefined, sort, order, limit: 30 }),
    [query, sort, order]
  );
  const products = data?.products ?? [];
  const pagination = data?.pagination ?? null;

  const hasQuery = query.length > 0;
  const showNoResults = hasQuery && !loading && products.length === 0;

  return (
    <div className="search-results-fullwidth">
      <header className="search-results-header">
        <div>
          <h1 className="search-results-title">
            {hasQuery
              ? `Resultados para "${query}"`
              : "Explora nuestro catálogo"}
          </h1>
          <p className="search-results-description">
            {hasQuery
              ? `Encontramos ${pagination?.totalResults ?? 0} productos`
              : "Usa la barra de búsqueda para encontrar rápidamente lo que necesitas."}
          </p>
        </div>
        {hasQuery && (
          <div className="search-results-controls">
            <label>Ordenar por: </label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="createdAt">Más recientes</option>
              <option value="price">Precio</option>
              <option value="name">Nombre</option>
            </select>
            <button
              type="button"
              className="sort-btn"
              onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
            >
              {order === "asc" ? "Ascendente" : "Descendente"}
            </button>
          </div>
        )}
      </header>
      {loading && (
        <div className="search-results-message">
          <h3>Buscando productos...</h3>
          <p>Esto puede tomar unos segundos.</p>
        </div>
      )}
      {!loading && error === "NETWORK" && (
        <div className="search-results-message">
          <h3>No pudimos conectar con el servidor</h3>
          <p>Revisa tu conexión a internet</p>
        </div>
      )}
      {!loading && error === "SERVER_ERROR" && (
        <div className="search-results-message">
          <h3>Algo salió mal de nuestro lado</h3>
          <p>Intenta de nuevo más tarde</p>
        </div>
      )}
      {!loading && error && error !== "NETWORK" && error !== "SERVER_ERROR" && (
        <div className="search-results-message">
          <h3>Ocurrió un error inesperado</h3>
        </div>
      )}
      {!loading && !error && showNoResults && (
        <div className="search-results-message">
          <h3>No encontramos coincidencias para "{query}"</h3>
          <p>Prueba con otros términos o recorre nuestras </p>
          <Link to="/">Ofertas destacadas</Link>
        </div>
      )}
      {!loading && !error && products.length > 0 && (
        <List
          products={products}
          layout="vertical"
          title={
            hasQuery ? `Resultados para "${query}"` : "Todos los productos"
          }
        />
      )}
    </div>
  );
}
