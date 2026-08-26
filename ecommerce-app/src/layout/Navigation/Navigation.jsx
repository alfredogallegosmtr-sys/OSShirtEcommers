import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/common/Icon/Icon";
import ErrorMessage from "../../components/common/ErrorMessage/ErrorMessage";
import Loading from "../../components/common/Loading/Loading";
import { useAuth } from "../../context/AuthContext";
import { getAllCategories } from "../../services/categoryService";
import "./Navigation.css";

// Mismo criterio de iniciales que usa Header.jsx (para que el avatar del
// panel transitorio se vea igual que el del menú de usuario).
const getUserInitials = (userData) => {
  if (!userData) return "U";
  const name =
    userData.displayName || userData.name || userData.email || "Usuario";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getFirstName = (userData) => {
  if (!userData) return "";
  const name = userData.displayName || userData.name || userData.email || "";
  return name.split(" ")[0];
};

const Navigation = ({ isMobile = false, onLinkClick }) => {
  const { user, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState(() => new Set());

  // Abre/cierra el desplegable de subcategorías de una categoría del panel
  // transitorio (cada categoría es independiente entre sí).
  const toggleCategory = (categoryId) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllCategories();
        if (cancelled) return;
        setCategories(data);
      } catch (err) {
        if (!cancelled) setError(err.kind || "UNKNOWN");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cierra el panel transitorio con Escape y bloquea el scroll del body
  // mientras está abierto.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsDrawerOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  // Categorías principales = raíces (sin parentCategory)
  const mainCategories = categories.filter((cat) => !cat.parentCategory);

  // Función para obtener subcategorías de una categoría principal
  const getSubcategories = (parentId) => {
    const subcategories = categories.filter(
      (cat) => cat.parentCategory && cat.parentCategory._id === parentId
    );
    return subcategories.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Si es versión móvil, renderizar solo los enlaces principales
  if (isMobile) {
    return (
      <div className="mobile-navigation">
        {/* Ofertas especiales */}
        <Link
          to="/offers"
          className="mobile-nav-link special"
          onClick={onLinkClick}
        >
          <Icon name="tag" size={20} />
          Ofertas del día
        </Link>
        <Link
          to="/new"
          className="mobile-nav-link special"
          onClick={onLinkClick}
        >
          <Icon name="sparkles" size={20} />
          Novedades
        </Link>
        <Link
          to="/bestsellers"
          className="mobile-nav-link special"
          onClick={onLinkClick}
        >
          <Icon name="star" size={20} />
          Más vendidos
        </Link>
        <Link
          to="/flash-sale"
          className="mobile-nav-link special"
          onClick={onLinkClick}
        >
          <Icon name="zap" size={20} />
          Flash sale
        </Link>

        {/* Categorías principales */}
        {loading && <Loading>Cargando categorías...</Loading>}
        {!loading && error && (
          <ErrorMessage>No pudimos cargar las categorías.</ErrorMessage>
        )}
        {!loading &&
          !error &&
          mainCategories.map((category) => (
            <Link
              key={category._id}
              to={`/category/${category._id}`}
              className="mobile-nav-link"
              onClick={onLinkClick}
            >
              <Icon name="chevronRight" size={16} />
              {category.name}
            </Link>
          ))}
      </div>
    );
  }

  return (
    <div className="navigation">
      {/* Backdrop del panel transitorio de categorías */}
      <div
        className={`categories-drawer-backdrop ${isDrawerOpen ? "open" : ""}`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Panel transitorio: todas las categorías, anclado al borde izquierdo */}
      <aside
        className={`categories-drawer ${isDrawerOpen ? "open" : ""}`}
        role="dialog"
        aria-label="Todas las categorías"
        aria-hidden={!isDrawerOpen}
      >
        <div className="categories-drawer-header">
          <div className="categories-drawer-user">
            <div className="user-avatar">
              <span className="user-initials">
                {isAuthenticated ? (
                  getUserInitials(user)
                ) : (
                  <Icon name="user" size={16} />
                )}
              </span>
            </div>
            <span className="categories-drawer-greeting">
              {isAuthenticated
                ? `Hola, ${getFirstName(user)}`
                : "Hola, Inicia sesión"}
            </span>
          </div>
          <button
            className="categories-drawer-close"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Cerrar"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="categories-drawer-body">
          <h2 className="categories-drawer-title">Todas las categorías</h2>
          {loading && <Loading>Cargando categorías...</Loading>}
          {!loading && error && (
            <ErrorMessage>No pudimos cargar las categorías.</ErrorMessage>
          )}
          {!loading &&
            !error &&
            mainCategories.map((category) => {
              const subcategories = getSubcategories(category._id);
              const hasSubcategories = subcategories.length > 0;
              const isExpanded = expandedCategoryIds.has(category._id);
              return (
                <div key={category._id} className="category-group">
                  {hasSubcategories ? (
                    <button
                      type="button"
                      className={`category-link main-category ${
                        isExpanded ? "expanded" : ""
                      }`}
                      onClick={() => toggleCategory(category._id)}
                      aria-expanded={isExpanded}
                    >
                      {category.name}
                      <Icon
                        name="chevronRight"
                        size={12}
                        className="category-toggle-icon"
                      />
                    </button>
                  ) : (
                    <Link
                      to={`/category/${category._id}`}
                      className="category-link main-category"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      {category.name}
                    </Link>
                  )}

                  {hasSubcategories && isExpanded && (
                    <div className="subcategories">
                      {subcategories.map((subcat) => (
                        <Link
                          key={subcat._id}
                          to={`/category/${subcat._id}`}
                          className="category-link sub-category"
                          onClick={() => setIsDrawerOpen(false)}
                        >
                          {subcat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

          <h2 className="categories-drawer-title">Atención al Cliente</h2>
          <div className="categories-drawer-support">
            <Link
              to="#"
              className="category-link"
              onClick={() => setIsDrawerOpen(false)}
            >
              Centro de Ayuda
            </Link>
            <Link
              to="#"
              className="category-link"
              onClick={() => setIsDrawerOpen(false)}
            >
              Cómo Comprar
            </Link>
            <Link
              to="#"
              className="category-link"
              onClick={() => setIsDrawerOpen(false)}
            >
              Envíos y Devoluciones
            </Link>
            <Link
              to="#"
              className="category-link"
              onClick={() => setIsDrawerOpen(false)}
            >
              Guía de Tallas
            </Link>
            <Link
              to="#"
              className="category-link"
              onClick={() => setIsDrawerOpen(false)}
            >
              Contacto
            </Link>
            <Link
              to="#"
              className="category-link"
              onClick={() => setIsDrawerOpen(false)}
            >
              Garantías
            </Link>
          </div>
        </div>
      </aside>

      <div className="container">
        <div className="navigation-content">
          {/* Disparador del panel transitorio de categorías */}
          <button
            className="categories-drawer-trigger"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Abrir todas las categorías"
          >
            <Icon name="list" size={18} />
            <span>Menú</span>
          </button>

          {/* Menú de todas las categorías */}
          <div className="categories-dropdown">
            <button
              className="categories-menu-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            >
              <Icon name="menu" size={16} />
              <span>Todas las categorías</span>
              <Icon name="chevronDown" size={14} />
            </button>

            {isDropdownOpen && (
              <div className="categories-dropdown-menu">
                {loading && <Loading>Cargando categorías...</Loading>}
                {!loading && error && (
                  <ErrorMessage>
                    No pudimos cargar las categorías.
                  </ErrorMessage>
                )}
                {!loading &&
                  !error &&
                  mainCategories.map((category) => {
                    const subcategories = getSubcategories(category._id);
                    return (
                    <div key={category._id} className="category-group">
                      <Link
                        to={`/category/${category._id}`}
                        className="category-link main-category"
                      >
                        {category.name}
                        {subcategories.length > 0 && (
                          <Icon name="chevronRight" size={12} />
                        )}
                      </Link>

                      {subcategories.length > 0 && (
                        <div className="subcategories">
                          {subcategories.map((subcat) => (
                            <Link
                              key={subcat._id}
                              to={`/category/${subcat._id}`}
                              className="category-link sub-category"
                            >
                              {subcat.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navegación horizontal */}
          <nav className="categories-nav">
            <Link to="/offers" className="nav-link special">
              Ofertas del día
            </Link>
            <Link to="/new" className="nav-link special">
              Novedades
            </Link>
            <Link to="/bestsellers" className="nav-link special">
              Más vendidos
            </Link>
            <Link to="/flash-sale" className="nav-link special">
              Flash sale
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
