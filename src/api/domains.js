// /api/domains.js
import apiClient from "./axios";

const getToken = () => localStorage.getItem("token") || "";

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

export const fetchDomains = async () => {
  try {
    const response = await apiClient.get("/api/v1/admin/domains", {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch domains";
    throw new Error(errorMessage);
  }
};

export const createDomain = async (domainData) => {
  try {
    const response = await apiClient.post("/api/v1/admin/domains", domainData, {
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
      "Failed to create domain";
    throw new Error(errorMessage);
  }
};

export const updateDomain = async (id, domainData) => {
  try {
    const response = await apiClient.put(
      `/api/v1/admin/domains/${id}`,
      domainData,
      {
        headers: {
          ...getHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update domain";
    throw new Error(errorMessage);
  }
};

export const deleteDomain = async (id) => {
  try {
    const response = await apiClient.delete(`/api/v1/admin/domains/${id}`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete domain";
    throw new Error(errorMessage);
  }
};
