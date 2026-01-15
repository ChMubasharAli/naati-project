// /api/segments.js
import apiClient from "./axios";

// Fetch segments
export const fetchSegments = async (dialogueId = "") => {
  try {
    const url = dialogueId
      ? `/api/v1/admin/segments?dialogueId=${dialogueId}`
      : "/api/v1/admin/segments";

    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch segments";
    throw new Error(errorMessage);
  }
};

// Create segment
export const createSegment = async (formData) => {
  try {
    const response = await apiClient.post("/api/v1/admin/segments", formData);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to create segment";
    throw new Error(errorMessage);
  }
};

// Update segment
export const updateSegment = async (id, formData) => {
  try {
    const response = await apiClient.put(
      `/api/v1/admin/segments/${id}`,
      formData
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update segment";
    throw new Error(errorMessage);
  }
};

// Delete segment
export const deleteSegment = async (id) => {
  try {
    const response = await apiClient.delete(`/api/v1/admin/segments/${id}`);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete segment";
    throw new Error(errorMessage);
  }
};