import BannerCarousel from "../components/BannerCarousel";
import List from "../components/List/List";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import homeImages from "../data/homeImages.json";
import { getAllProducts } from "../services/productsService";
import useFetch from "../hooks/useFetch";

export default function Home() {
  const { data, loading, error } = useFetch(() => getAllProducts(), []);
  const products = data?.products ?? [];

  return (
    <div>
      <BannerCarousel banners={homeImages} />
      {loading && <Loading>Cargando productos...</Loading>}
      {!loading && error && error === "NETWORK" && (
        <ErrorMessage>
          <h3>No pudimos cargar el catálogo</h3>
          <p>
            Puede ser tu conexión a internet o que nuestro servidor no esté
            respondiendo en este momento. Tu carrito y tu sesión no se
            vieron afectados.
          </p>
          <Button onClick={() => window.location.reload()}>
            Intentar de nuevo
          </Button>
        </ErrorMessage>
      )}
      {!loading && error && error === "SERVER_ERROR" && (
        <ErrorMessage>
          <h3>No pudimos cargar el catálogo</h3>
          <p>
            Algo salió mal de nuestro lado. Tu carrito y tu sesión no se
            vieron afectados — intenta de nuevo en unos minutos.
          </p>
          <Button onClick={() => window.location.reload()}>
            Intentar de nuevo
          </Button>
        </ErrorMessage>
      )}
      {!loading && error && error !== "NETWORK" && error !== "SERVER_ERROR" && (
        <ErrorMessage>
          <h3>No pudimos cargar el catálogo</h3>
          <p>
            Ocurrió un error inesperado. Tu carrito y tu sesión no se vieron
            afectados — intenta de nuevo.
          </p>
          <Button onClick={() => window.location.reload()}>
            Intentar de nuevo
          </Button>
        </ErrorMessage>
      )}
      {!loading && !error && products.length === 0 && (
        <ErrorMessage>No hay productos en el catálogo.</ErrorMessage>
      )}
      {!loading && !error && products.length > 0 && (
        <>
          <List
            title="Productos recomendados"
            products={products.slice(0, 5)}
            layout="carousel"
          />
          {/* TODO: reemplazar por productos filtrados por oferta real cuando exista esa lógica */}
          <List
            title="Ofertas del día"
            products={products.slice(5, 15)}
            layout="carousel"
          />
          {/* TODO: reemplazar por productos filtrados por "novedad" real cuando exista esa lógica */}
          <List
            title="Novedades"
            products={products.slice(15, 25)}
            layout="carousel"
          />
          {/* TODO: reemplazar por productos ordenados por ventas reales cuando exista esa lógica */}
          <List
            title="Más vendidos"
            products={products.slice(25, 35)}
            layout="carousel"
          />
          {/* TODO: reemplazar por productos filtrados por flash sale real cuando exista esa lógica */}
          <List
            title="Flash sale"
            products={products.slice(35, 45)}
            layout="carousel"
          />
        </>
      )}
    </div>
  );
}
