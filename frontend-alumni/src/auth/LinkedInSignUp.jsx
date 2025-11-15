import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import API from "../services/api";

const LinkedInSignUp = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleLinkedInClick = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get LinkedIn auth URL from backend (this will create session with state)
      const response = await API.get("/auth/linkedin", {
        withCredentials: true, // Important for session cookies
      });

      if (response.data.status === "success" && response.data.data.authUrl) {
        // Redirect to LinkedIn authorization page
        window.location.href = response.data.data.authUrl;
      } else {
        throw new Error("Failed to get LinkedIn auth URL");
      }
    } catch (error) {
      console.error("LinkedIn auth error:", error);
      alert(error.response?.data?.message || "Failed to initiate LinkedIn authentication");
      setLoading(false);
    }
  };

  return (
    <div className="divider-section">
      <div className="divider">
        <div className="divider-line"></div>
        <span className="divider-text">{t("or")}</span>
        <div className="divider-line"></div>
      </div>
      <a
        href="#"
        onClick={handleLinkedInClick}
        className="linkedin-btn"
        style={{ pointerEvents: loading ? "none" : "auto", opacity: loading ? 0.6 : 1 }}
      >
        <svg className="linkedin-icon" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        {loading ? t("loading") || "Loading..." : t("signUpWithLinkedIn")}
      </a>
    </div>
  );
};

export default LinkedInSignUp;
