import React from "react";
import { FaLinkedin } from "react-icons/fa"
import "./LinkedInSignUp.css"

const LinkedInSignUp = () => {
  const handleLinkedInLogin = async () => {
    try {
      console.log("Requesting LinkedIn auth URL...");
      // اطلب auth URL من السيرفر
      const res = await fetch("http://localhost:5005/alumni-portal/auth/linkedin");
      const data = await res.json();

      console.log("LinkedIn auth URL response:", data);

      if (data.status === "success" && data.data?.authUrl) {
        // حول المستخدم لصفحة LinkedIn
        console.log("Redirecting to LinkedIn:", data.data.authUrl);
        window.location.href = data.data.authUrl;
      } else {
        console.error("LinkedIn auth URL request failed:", data);
        alert("Failed to get LinkedIn authentication URL. Please try again.");
      }
    } catch (err) {
      console.error("LinkedIn login error:", err);
      alert("An error occurred while connecting to LinkedIn. Please try again.");
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
