// /api/dialogues.js
import apiClient from "./axios";

const getToken = () => localStorage.getItem("token") || "";

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

export const fetchDialogues = async (userId, languageId) => {
  try {
    const response = await apiClient.get(
      `/api/v1/admin/dialogues?userId=${userId}&languageId=${languageId}`,
      
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch dialogues";
    throw new Error(errorMessage);
  }
};

export const createDialogue = async (dialogueData) => {
  try {
    const response = await apiClient.post(
      "/api/v1/admin/dialogues",
      dialogueData,
      {
        headers: {
          ...getHeaders(),
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to create dialogue";
    throw new Error(errorMessage);
  }
};

export const updateDialogue = async (id, dialogueData) => {
  try {
    const response = await apiClient.put(
      `/api/v1/admin/dialogues/${id}`,
      dialogueData,
      {
        headers: {
          ...getHeaders(),
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update dialogue";
    throw new Error(errorMessage);
  }
};

export const deleteDialogue = async (id) => {
  try {
    const response = await apiClient.delete(`/api/v1/admin/dialogues/${id}`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete dialogue";
    throw new Error(errorMessage);
  }
};
