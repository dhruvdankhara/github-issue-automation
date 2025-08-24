import axios, {
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

// Get the API base URL from environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60 seconds timeout
});

// Request interceptor to add any auth headers if needed
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add any common headers here
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for common error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common errors here
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.warn("Unauthorized access");
    } else if (error.response?.status === 500) {
      // Handle server errors
      console.error("Server error:", error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default api;

// Export the base URL for cases where we need to construct URLs manually
export { API_BASE_URL };
