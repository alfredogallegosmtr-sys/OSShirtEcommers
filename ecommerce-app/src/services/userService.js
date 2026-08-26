import apiClient from "./apiClient";

const getMe = async () => {
  const response = await apiClient.get("/users/me");
  return response.data;
};

const updateMe = async (data) => {
  const response = await apiClient.put("/users/me", data);
  return response.data;
};

const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await apiClient.put("/users/me/password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export { getMe, updateMe, changePassword };
