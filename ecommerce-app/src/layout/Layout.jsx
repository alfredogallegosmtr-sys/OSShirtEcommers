import ErrorBoundary from "../components/common/ErrorBoundary/ErrorBoundary";
import Footer from "./Footer/Footer";
import Header from "./Header/Header";
import "./Layout.css";

export default function Layout({ children }) {
  return (
    <div className="layout">
      {/* Boundary propio: Header monta Navigation (fetch + lógica derivada de
          categorías) en cada ruta. Sin este boundary, un error ahí tumbaba
          toda la app (incluido el contenido de la página, ya protegido por
          su propio ErrorBoundary en App.jsx). Footer es puramente
          presentacional, sin fetch ni lógica de riesgo — no lo necesita. */}
      <ErrorBoundary>
        <Header />
      </ErrorBoundary>
      {children}
      <Footer />
    </div>
  );
}
