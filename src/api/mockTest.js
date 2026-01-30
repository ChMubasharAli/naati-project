// /api/mockTests.js
import apiClient from "./axios";

const getToken = () => localStorage.getItem("token") || "";

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

// Mock Tests APIs
export const fetchMockTests = async (userId, languageId) => {
  try {
    // ✅ Fix: Add query parameters
    let url = `/api/v1/mockTest?userId=${userId}`;
    if (languageId) {
      url += `&languageId=${languageId}`;
    }

    const response = await apiClient.get(url, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch mock tests";
    throw new Error(errorMessage);
  }
};

// ✅ IMPORTANT FIX: Ensure update function has correct endpoint
export const updateMockTest = async (mockTestData) => {
  try {
    const response = await apiClient.patch(
      `/api/v1/mockTest/${mockTestData.id}`, // Assuming PUT endpoint
      mockTestData,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update mock test";
    throw new Error(errorMessage);
  }
};

// Keep other functions same
export const createMockTest = async (mockTestData) => {
  try {
    const response = await apiClient.post("/api/v1/mockTest", mockTestData, {
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
      "Failed to create mock test";
    throw new Error(errorMessage);
  }
};

export const deleteMockTest = async (id) => {
  try {
    const response = await apiClient.delete(`/api/v1/mockTest/${id}`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete mock test";
    throw new Error(errorMessage);
  }
};
