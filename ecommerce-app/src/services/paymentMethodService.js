import apiClient from "./apiClient";

const getPaymentMethods = async () => {
  const response = await apiClient.get("/payment-methods");
  return response.data;
};

const createPaymentMethod = async (data) => {
  const response = await apiClient.post("/payment-methods", data);
  return response.data;
};

const updatePaymentMethod = async (paymentMethodId, data) => {
  const response = await apiClient.put(`/payment-methods/${paymentMethodId}`, data);
  return response.data;
};

const deletePaymentMethod = async (paymentMethodId) => {
  const response = await apiClient.delete(`/payment-methods/${paymentMethodId}`);
  return response.data;
};

export { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod };
