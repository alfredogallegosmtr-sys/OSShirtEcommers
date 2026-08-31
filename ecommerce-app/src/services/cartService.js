import apiClient from "./apiClient";

const getCart = async () => {
  const response = await apiClient.get("/cart");
  return response.data;
};

const addItem = async (productId, quantity = 1) => {
  const response = await apiClient.post("/cart", { productId, quantity });
  return response.data;
};

const updateQuantity = async (itemId, quantity, clientTimestamp) => {
  const response = await apiClient.patch(`/cart/${itemId}`, { quantity, clientTimestamp });
  return response.data;
};

const removeItem = async (itemId) => {
  const response = await apiClient.delete(`/cart/${itemId}`);
  return response.data;
}

const clearCart = async () => {
  const response = await apiClient.delete("/cart");
  return response.data;
};

export { getCart, addItem, updateQuantity, removeItem, clearCart };
