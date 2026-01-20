// src/api/contact.js
import apiClient from "./axios";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Fetch messages with pagination

export const fetchMessages = async ({ page = 1, limit = 20, search = "" }) => {
  try {
    let url = `/api/v1/contact?page=${page}&limit=${limit}`;

    // Add search parameter if provided
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await apiClient.get(url, {
      headers: getAuthHeaders(),
    });

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch messages";

    throw new Error(errorMessage);
  }
};

// Delete a message

export const deleteMessage = async (id) => {
  try {
    const response = await apiClient.delete(`/api/v1/contact/${id}`, {
      headers: getAuthHeaders(),
    });

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete message";

    throw new Error(errorMessage);
  }
};

// Get message by ID

export const getMessageById = async (id) => {
  try {
    const response = await apiClient.get(`/api/v1/contact/${id}`, {
      headers: getAuthHeaders(),
    });

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch message details";

    throw new Error(errorMessage);
  }
};
