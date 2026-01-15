// /api/users.js
import apiClient from "./axios";

const getToken = () => localStorage.getItem("token") || "";

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

export const fetchUsers = async () => {
  try {
    const response = await apiClient.get("/api/v1/users", {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch users";
    throw new Error(errorMessage);
  }
};

export const createUser = async (userData) => {
  try {
    const response = await apiClient.post("/api/v1/users", userData, {
      headers: {
        ...getHeaders(),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to create user";
    throw new Error(errorMessage);
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await apiClient.put(`/api/v1/users/${id}`, userData, {
      headers: {
        ...getHeaders(),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update user";
    throw new Error(errorMessage);
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await apiClient.delete(`/api/v1/users/${id}`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete user";
    throw new Error(errorMessage);
  }
};