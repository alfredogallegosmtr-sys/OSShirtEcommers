import apiClient from "./apiClient";

const getWishlist = async () => {
  const response = await apiClient.get("/wishlist");
  return response.data;
};

const addToWishlist = async (productId) => {
  const response = await apiClient.post("/wishlist", { productId });
  return response.data;
};

const removeFromWishlist = async (productId) => {
  const response = await apiClient.delete(`/wishlist/${productId}`);
  return response.data;
};

export { getWishlist, addToWishlist, removeFromWishlist };
