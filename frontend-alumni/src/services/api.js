import axios from "axios";
import i18n from "../i18n/i18n";

const API = axios.create({
  // baseURL: "/alumni-portal", //local
  baseURL: process.env.REACT_APP_BACKEND_URL || "/alumni-portal",
  withCredentials: true,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["Accept-Language"] = i18n.language;

    return config;
  },
  (error) => Promise.reject(error),
);

export default API;
