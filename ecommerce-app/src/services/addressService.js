import apiClient from "./apiClient";

const getAddresses = async () => {
  const response = await apiClient.get("/addresses");
  return response.data;
};

const createAddress = async (data) => {
  const response = await apiClient.post("/addresses", data);
  return response.data;
};

const updateAddress = async (addressId, data) => {
  const response = await apiClient.put(`/addresses/${addressId}`, data);
  return response.data;
};

const deleteAddress = async (addressId) => {
  const response = await apiClient.delete(`/addresses/${addressId}`);
  return response.data;
};

export { getAddresses, createAddress, updateAddress, deleteAddress };
