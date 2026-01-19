// src/api/transaction.js
import apiClient from "./axios";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// Get authorization headers

const getAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

// Fetch all transactions

export const fetchTransactions = async () => {
  try {
    const response = await apiClient.get("/api/v1/transaction", {
      headers: getAuthHeaders(),
    });
    return response.data || [];
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch transactions";
    throw new Error(errorMessage);
  }
};

// Fetch single transaction by ID

export const fetchTransactionById = async (id) => {
  try {
    const response = await apiClient.get(`/api/v1/transaction/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch transaction details";
    throw new Error(errorMessage);
  }
};

// Update transaction

export const updateTransaction = async (id, data) => {
  try {
    const response = await apiClient.put(`/api/v1/transaction/${id}`, data, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update transaction";
    throw new Error(errorMessage);
  }
};

// Delete transaction

export const deleteTransaction = async (id) => {
  try {
    const response = await apiClient.delete(`/api/v1/transaction/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete transaction";
    throw new Error(errorMessage);
  }
};
