// src/api/admin.js
import apiClient from "./axios";

// Get admin dashboard data

export const getDashboardData = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await apiClient.get("/api/v1/admin/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch dashboard data";

    throw new Error(errorMessage);
  }
};

// Format currency from cents to dollars

export const formatCurrency = (cents) => {
  return `$${(cents / 100).toFixed(2)}`;
};
