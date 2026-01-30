import apiClient from "./axios";

export const fetchMockTests = async (userId, languageId) => {
  try {
    const response = await apiClient.get(
      `/api/v1/mockTest?userId=${userId}&languageId=${languageId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching mock tests:", error);
    throw error;
  }
};

export const startMockTestAttempt = async (data) => {
  try {
    const response = await apiClient.post(
      "/api/v1/mockTestAttempt/start",
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Error starting mock test:", error);
    throw error;
  }
};

export const submitMockTestSegment = async (formData) => {
  try {
    const response = await apiClient.post(
      "/api/v1/mockTestAttempt/segment/submit",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting mock test segment:", error);
    throw error;
  }
};

export const getMockTestProgress = async (sessionId, userId) => {
  try {
    const response = await apiClient.get(
      `/api/v1/mockTestAttempt/sessions/${sessionId}/progress`,
      {
        params: { userId },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error getting mock test progress:", error);
    throw error;
  }
};

export const getMockTestResult = async (sessionId, userId) => {
  try {
    const response = await apiClient.get(
      `/api/v1/mockTestAttempt/sessions/${sessionId}/result`,
      {
        params: { userId },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error getting mock test result:", error);
    throw error;
  }
};

export const getSessionTime = async (sessionId, userId) => {
  try {
    const response = await apiClient.get(
      `/api/v1/mockTestSessionTime/sessions/${sessionId}/completed-seconds`,
      {
        params: { userId },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error getting session time:", error);
    throw error;
  }
};

export const incrementSessionTime = async (sessionId, data) => {
  try {
    const response = await apiClient.patch(
      `/api/v1/mockTestSessionTime/sessions/${sessionId}/completed-seconds/increment`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Error incrementing session time:", error);
    throw error;
  }
};
