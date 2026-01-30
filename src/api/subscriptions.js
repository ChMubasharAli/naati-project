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

// this section is for user side fetch specific user subscriptions and user can delete subscription

export const fetchUserSubscriptions = async (userId) => {
  try {
    const response = await apiClient.get(
      `/api/v1/subscriptions/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch subscriptions";
    throw new Error(errorMessage);
  }
};

export const cancelSubscription = async (
  subscriptionId,
  userId,
  cancelNow = false,
) => {
  try {
    const response = await apiClient.patch(
      `/api/v1/stripe/subscriptions/cancel/${subscriptionId}`,
      {
        userId,
        cancelNow,
      },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to cancel subscription";
    throw new Error(errorMessage);
  }
};
