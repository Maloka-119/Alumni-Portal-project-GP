// services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5005/alumni-portal", 
});

export default API;
