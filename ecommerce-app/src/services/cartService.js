import apiClient from "./apiClient";

const getCart = async () => {
  return apiClient.get("/api/cart");
};

const addItem = async (productId, quantity = 1) => {
  return apiClient.post("/api/cart", {productId, quantity});
};

const updateQuantity = async (itemId, quantity) => {
  return apiClient.patch(`/api/cart/${itemId}`, {quantity});
};

const removeItem = async (itemId) => {
  return apiClient.delete(`/api/cart/${itemId}`);
}

const clearCart = async () => {
  return apiClient.delete("/api/cart");
};

export { getCart, addItem, updateQuantity, removeItem, clearCart };