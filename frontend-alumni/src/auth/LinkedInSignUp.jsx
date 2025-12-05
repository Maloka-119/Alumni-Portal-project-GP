import React from "react";
import { FaLinkedin } from "react-icons/fa"
import "./LinkedInSignUp.css"

const LinkedInSignUp = () => {
  const handleLinkedInLogin = async () => {
    try {
      // اطلب auth URL من السيرفر
      const res = await fetch("http://localhost:5005/alumni-portal/auth/linkedin");
      const data = await res.json();

      if (data.status === "success") {
        // حول المستخدم لصفحة LinkedIn
        window.location.href = data.data.authUrl;
      }
    } catch (err) {
      console.error("LinkedIn login error:", err);
    }
  };

  return (
    <button
    type="button"
    className="linkedin-btn"
    onClick={handleLinkedInLogin}
  >
    <FaLinkedin size={18} color="#0A66C2" />
    Sign up with LinkedIn
  </button>
  
  );
};

export default LinkedInSignUp;
