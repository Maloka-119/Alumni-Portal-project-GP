import React, { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import "./LinkedInSignUp.css";

const LinkedInSignUp = ({ setUser }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const res = await API.get("/auth/linkedin");
      const authUrl = res.data?.data?.authUrl;

      if (authUrl) {
        // نفتح لينكدإن في نافذة جديدة
        window.location.href = authUrl;
      } else {
        alert("Failed to get LinkedIn authorization URL. Try again later.");
      }
    } catch (err) {
      console.error("Error fetching LinkedIn auth URL:", err);
      alert("Cannot connect to server. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignUp}
      disabled={loading}
      className="linkedin-button"
    >
      <img
        src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
        alt="LinkedIn"
      />
      {loading ? "Redirecting..." : "Sign up with LinkedIn"}
    </button>
  );
};

export default LinkedInSignUp;
