import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { 
  getCart as serviceGetCart, 
  addItem as serviceAddItem, 
  updateQuantity as serviceUpdateQuantity, 
  removeItem as serviceRemoveItem, 
  clearCart as serviceClearCart 
} from "../services/cartService";
// import { jsx } from "react/jsx-runtime";

const CartContext = createContext();

export function CartProvider({ children }) {

  const { isAuthenticated } = useAuth();
  const [items,setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true)
      try {
        const data = await serviceGetCart();
        if (!cancelled) setItems(data.items);
      } catch (error) {
        if(!cancelled) setError(error.kind ?? "SERVER_ERROR");
      } finally {
        if(!cancelled) setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  const count = useMemo(() => items.reduce((acc, it) => acc + it.quantity, 0), [items]);

  const total = useMemo(() => items.reduce((acc, it) => acc + it.quantity * it.product.price, 0), [items]);

  const addItem = async (product, quantity = 1) => {
    const previous = items;

    //UPDATE
    setItems((curr) => {
      const existing = curr.find((it) => it.product.id === product.id);
      if(existing) {
        return curr.map((it) => it.product.id === product.id ? {...it, quantity: it.quantity + quantity} : it,);
      }
      return [...curr, { id: product.id, quantity, product }]
    });

    //CONFIRMAR o ROLLBACK
    try{
      const data = await serviceAddItem(product.id, quantity);
      setItems(data.items);
    } catch(error) {
      setItems(previous);
      setError(error.kind ?? "SERVER_ERROR");
    }
  };

  const updateItem = async (itemId, quantity) => {
    const previous = items;

    setItems((curr) => 
      curr.map((it) => it.id === itemId ? { ...it, quantity } : it));
    
    try {
      const data = await serviceUpdateQuantity(itemId, quantity);
      setItems(data.items);
    } catch (error) {
      setItems(previous);
      setError(error.kind ?? "SERVER_ERROR");      
    }
  };
  
  const removeItem = async (itemId) => {
    const previous = items;

    setItems((curr) => curr.filter((it)=> it.id === itemId ));

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
