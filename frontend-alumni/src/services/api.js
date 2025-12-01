import axios from "axios";
import i18n from "../i18n/i18n";

const API = axios.create({
  baseURL: "http://localhost:5005/alumni-portal",
  withCredentials: true,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // هنا بنضيف اللغة الحالية للـ backend
    config.headers["Accept-Language"] = i18n.language;

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
