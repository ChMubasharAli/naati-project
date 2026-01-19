import apiClient from "./axios";

// api function for register user
export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post("/api/v1/auth/register", userData);

    return response.data;
  } catch (error) {
    // Handle axios error
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";

    throw new Error(errorMessage);
  }
};

// api function for verify OTP
export const verifyOTP = async (otpData) => {
  try {
    const response = await apiClient.post("/api/v1/auth/verify-otp", otpData);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";
    throw new Error(errorMessage);
  }
};

// api function for Resend OTP

export const resendOTP = async (emailData) => {
  try {
    const response = await apiClient.post("/api/v1/auth/resend-otp", emailData);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to resend OTP. Please try again.";
    throw new Error(errorMessage);
  }
};

// API function for fotgot-password

export const forgotPassword = async (email) => {
  try {
    const response = await apiClient.post("/api/v1/auth/forgot-password", {
      email,
    });
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";

    throw new Error(errorMessage);
  }
};

// Update user
export const changePassword = async (userId, data) => {
  try {
    const response = await apiClient.put(`/api/v1/users/${userId}`, data);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to change password";
    throw new Error(errorMessage);
  }
};
