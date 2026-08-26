import apiClient from "./apiClient";

const getOrders = async () => {
  const response = await apiClient.get("/orders");
  return response.data;
};

const createOrder = async ({ addressId, paymentMethodId }) => {
  const response = await apiClient.post("/orders", { addressId, paymentMethodId });
  return response.data;
};

export { getOrders, createOrder };
