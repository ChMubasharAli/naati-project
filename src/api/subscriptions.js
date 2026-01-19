// src/api/subscriptions.js
import apiClient from "./axios";

// Get authentication token from localStorage

const getToken = () => localStorage.getItem("token");

// Get all subscriptions

export const getSubscriptions = async () => {
  try {
    const response = await apiClient.get("/api/v1/subscriptions/", {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch subscriptions";
    throw new Error(errorMessage);
  }
};

//  Get single subscription by ID

export const getSubscriptionById = async (id) => {
  try {
    const response = await apiClient.get(`/api/v1/subscriptions/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch subscription";
    throw new Error(errorMessage);
  }
};

// Update subscription

export const updateSubscription = async ({ id, ...updateData }) => {
  try {
    const response = await apiClient.put(
      `/api/v1/subscriptions/${id}`,
      updateData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update subscription";
    throw new Error(errorMessage);
  }
};

// Delete subscription

export const deleteSubscription = async (id) => {
  try {
    const response = await apiClient.delete(`/api/v1/subscriptions/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete subscription";
    throw new Error(errorMessage);
  }
};
