// src/services/api.js
import axios from "axios";

// قراءة backend URL من ملف .env
const BASE_URL = process.env.REACT_APP_BACKEND_URL
  ? `${process.env.REACT_APP_BACKEND_URL}/alumni-portal`
  : "http://localhost:5005/alumni-portal";

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// إضافة interceptor لإرسال التوكن تلقائيًا لو موجود
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
