import apiClient from "./axios";

const getToken = () => localStorage.getItem("token") || "";

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

// Start a new exam attempt
export const startExamAttempt = async (examData) => {
  try {
    const response = await apiClient.post("/api/v1/exams", examData, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to start exam attempt";
    throw new Error(errorMessage);
  }
};

// Submit a segment
export const submitSegment = async (formData) => {
  try {
    const response = await apiClient.post(
      "/api/v1/mocktest/ai-exam",
      formData,
      {
        headers: {
          ...getHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to submit segment";
    throw new Error(errorMessage);
  }
};

// Get final result
export const getExamResult = async (examAttemptId) => {
  try {
    const response = await apiClient.get(
      `/api/v1/exams/computeResult/${examAttemptId}`,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to get exam result";
    throw new Error(errorMessage);
  }
};
