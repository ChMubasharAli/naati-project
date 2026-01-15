import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

// Add interceptor to handle headers dynamically
apiClient.interceptors.request.use(
  (config) => {
    // Add authorization token if exists
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // IMPORTANT: For FormData, let browser set Content-Type
    // For JSON data, set Content-Type to application/json
    if (config.data instanceof FormData) {
      // Remove any existing Content-Type so browser can set it
      delete config.headers["Content-Type"];
    } else if (config.data && typeof config.data === "object") {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
