// src/auth/LinkedInSignUp.jsx
import React, { useState } from "react";
import API from "../services/api";

const LinkedInSignUp = () => {
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);

    try {
      // اطلب من الباك اند رابط OAuth
      const res = await API.get("/auth/linkedin");
      const authUrl = res.data?.data?.authUrl;

      if (authUrl) {
        // إعادة التوجيه للـ LinkedIn
        window.location.href = authUrl;
      } else {
        alert("Failed to get LinkedIn authorization URL. Try again later.");
      }
    } catch (err) {
      console.error("Error fetching LinkedIn auth URL:", err);
      alert("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleSignUp} disabled={loading}>
      {loading ? "Redirecting to LinkedIn..." : "Sign up with LinkedIn"}
    </button>
  );
};

export default LinkedInSignUp;
