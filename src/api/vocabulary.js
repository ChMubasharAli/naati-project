// /api/vocabulary.js
import apiClient from "./axios";

const getToken = () => localStorage.getItem("token") || "";

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

// Vocabulary APIs
export const fetchVocabularies = async (params = {}) => {
  try {
    const { userId = "", languageId = "" } = params;

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append("userId", userId);
    if (languageId) queryParams.append("languageId", languageId);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/api/v1/vocabulary?${queryString}`
      : `/api/v1/vocabulary`;

    const response = await apiClient.get(endpoint, {
      headers: getHeaders(),
    });

    // Return consistent structure
    const data = response.data;
    const vocabularies = data.data || data || [];

    return {
      ...data,
      data: vocabularies,
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch vocabularies";
    throw new Error(errorMessage);
  }
};

export const createVocabulary = async (vocabularyData) => {
  try {
    const response = await apiClient.post(
      "/api/v1/vocabulary",
      vocabularyData,
      {
        headers: getHeaders(),
        // Note: For FormData, Content-Type will be set automatically by axios interceptor
      },
    );

    const data = response.data;
    const vocabulary = data.data || data;

    return {
      ...data,
      data: vocabulary,
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to create vocabulary";
    throw new Error(errorMessage);
  }
};

export const updateVocabulary = async (id, vocabularyData) => {
  try {
    const response = await apiClient.put(
      `/api/v1/vocabulary/${id}`,
      vocabularyData,
      {
        headers: getHeaders(),
      },
    );

    const data = response.data;
    const vocabulary = data.data || data;

    return {
      ...data,
      data: vocabulary,
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update vocabulary";
    throw new Error(errorMessage);
  }
};

export const deleteVocabulary = async (id) => {
  try {
    const response = await apiClient.delete(`/api/v1/vocabulary/${id}`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete vocabulary";
    throw new Error(errorMessage);
  }
};
