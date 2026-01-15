import apiClient from "./axios";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

export const fetchLanguages = async () => {
  try {
    const response = await apiClient.get("/api/v1/admin/languages", {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    const data = response.data;

    // Extract languages array from response
    // Response structure: { success: true, data: { languages: [...] } }
    const languages = data.data?.languages || [];

    // Return consistent structure
    return {
      ...data,
      data: languages, // Make sure data is always an array
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch languages";

    throw new Error(errorMessage);
  }
};

export const createLanguage = async (languageData) => {
  try {
    const response = await apiClient.post(
      "/api/v1/admin/languages",
      languageData,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    const data = response.data;

    // Response structure: { success: true, data: { language: {...} } }
    // Extract language object
    const language = data.data?.language;

    // Return consistent structure
    return {
      ...data,
      data: language,
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to create language";

    throw new Error(errorMessage);
  }
};

export const updateLanguage = async (id, languageData) => {
  try {
    const response = await apiClient.put(
      `/api/v1/admin/languages/${id}`,
      languageData,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    const data = response.data;

    // Extract updated language object
    const language = data.data?.language;

    // Return consistent structure
    return {
      ...data,
      data: language,
    };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update language";

    throw new Error(errorMessage);
  }
};

export const deleteLanguage = async (id) => {
  try {
    const response = await apiClient.delete(`/api/v1/admin/languages/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete language";

    throw new Error(errorMessage);
  }
};
