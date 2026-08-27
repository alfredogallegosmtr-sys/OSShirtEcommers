import { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "./AuthContext";
import {
  getCart as serviceGetCart,
  addItem as serviceAddItem,
  updateQuantity as serviceUpdateQuantity,
  removeItem as serviceRemoveItem,
  clearCart as serviceClearCart
} from "../services/cartService";

const CartContext = createContext();
const CART_STORAGE_KEY = "cart";

// El carrito vive primero en localStorage: así funciona para invitados sin
// sesión. Cuando hay sesión, además se sincroniza contra el backend.
// Es un dato externo (el usuario o una versión vieja de la app pudo haber
// dejado algo mal formado ahí), así que se descarta cualquier item inválido
// en vez de asumir su forma.
const isValidCartItem = (item) =>
  item &&
  typeof item === "object" &&
  item.product &&
  typeof item.product.price === "number";

const readLocalCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isValidCartItem) : [];
  } catch {
    return [];
  }
};

const writeLocalCart = (items) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export function CartProvider({ children }) {

  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState(readLocalCart);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const syncedRef = useRef(false);
  const updateSeqRef = useRef({});

  useEffect(() => {
    writeLocalCart(items);
  }, [items]);

  // Al iniciar sesión: se trae el carrito del servidor y se fusiona con lo que
  // el invitado ya tenía guardado localmente (los productos que no existan en
  // el servidor se agregan; el resto queda tal cual el servidor lo devuelve).
  useEffect(() => {
    if (!isAuthenticated) {
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;
    syncedRef.current = true;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const guestItems = readLocalCart();
        const data = await serviceGetCart();
        let serverItems = data.items;

        const missing = guestItems.filter(
          (guestItem) =>
            !serverItems.some((it) => it.product._id === guestItem.product._id),
        );

        for (const guestItem of missing) {
          const updated = await serviceAddItem(guestItem.product._id, guestItem.quantity);
          serverItems = updated.items;
        }

        if (!cancelled) setItems(serverItems);
      } catch (error) {
        if (!cancelled) setError(error.kind ?? "SERVER_ERROR");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const count = useMemo(() => items.reduce((acc, it) => acc + it.quantity, 0), [items]);

  const total = useMemo(() => items.reduce((acc, it) => acc + it.quantity * it.product.price, 0), [items]);

  const addItem = async (product, quantity = 1) => {
    const previous = items;

    //UPDATE (funciona igual con o sin sesión)
    setItems((curr) => {
      const existing = curr.find((it) => it.product._id === product._id);
      if(existing) {
        return curr.map((it) => it.product._id === product._id ? {...it, quantity: it.quantity + quantity} : it,);
      }
      return [...curr, { id: product._id, quantity, product }]
    });

    if (!isAuthenticated) return; // invitado: se queda solo en localStorage

    //CONFIRMAR o ROLLBACK contra el backend
    try{
      const data = await serviceAddItem(product._id, quantity);
      setItems(data.items);
    } catch(error) {
      setItems(previous);
      setError(error.kind ?? "SERVER_ERROR");
    }
  };

  const updateItem = async (itemId, quantity) => {
    if (quantity < 1) return removeItem(itemId);

    const previous = items;
    // Dos cambios de cantidad rápidos sobre el mismo item (ej. +/- en sucesión) disparan dos
    // peticiones en paralelo; si la respuesta de la más vieja llega después, pisaría el estado
    // con una cantidad obsoleta. Se descarta cualquier respuesta que no sea de la última
    // petición disparada para este itemId (bug real, encontrado por checkout.cy.js en CI).
    const seq = (updateSeqRef.current[itemId] = (updateSeqRef.current[itemId] || 0) + 1);

    setItems((curr) =>
      curr.map((it) => it.id === itemId ? { ...it, quantity } : it));

    if (!isAuthenticated) return;

    try {
      const data = await serviceUpdateQuantity(itemId, quantity);
      if (updateSeqRef.current[itemId] === seq) setItems(data.items);
    } catch (error) {
      if (updateSeqRef.current[itemId] === seq) {
        setItems(previous);
        setError(error.kind ?? "SERVER_ERROR");
      }
    }
  };

  const removeItem = async (itemId) => {
    const previous = items;

    setItems((curr) => curr.filter((it)=> it.id !== itemId ));

    if (!isAuthenticated) return;

    try {
      const data = await serviceRemoveItem(itemId);
      setItems(data.items);
    } catch (error) {
      setItems(previous);
      setError(error.kind || "SERVER_ERROR");
    }
  };

  const clearCart = async () => {
    const previous = items;
    setItems([]);

    if (!isAuthenticated) return;

    try {
      await serviceClearCart();
    } catch (error) {
      setItems(previous);
      setError(error.kind ?? "SERVER_ERROR");
    }
  };

  // Helpers expuestos como funciones para los componentes que las esperan.
  const getTotalItems = () => count;
  const getTotalPrice = () => total;

  const value = {
    items,
    cartItems: items, // alias usado por Cart/Checkout/CartView
    count,
    total,
    getTotalItems,
    getTotalPrice,
    addItem,
    updateItem,
    updateQuantity: updateItem, // alias usado por CartView
    removeItem,
    clearCart,
    loading,
    error,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart debe ser usado dentro de CartProvider");
  return context;
}
