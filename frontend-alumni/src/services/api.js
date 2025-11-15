import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5005/alumni-portal",
  withCredentials: true, // Enable cookies for session management
});

// Interceptor to attach token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
