import React, { useState } from "react";
import { FaLinkedin } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import "./LinkedInSignUp.css";
import "./Register.css"; // Import Register.css for modal styles

const LinkedInSignUp = () => {
  const { t } = useTranslation();
  const [showNidModal, setShowNidModal] = useState(false);
  const [linkedInNationalId, setLinkedInNationalId] = useState("");

  const handleLinkedInLogin = () => {
    // Show National ID modal first (like Google signup)
    setShowNidModal(true);
  };

  const handleLinkedInNidSubmit = async () => {
    if (!linkedInNationalId.trim()) {
      alert(t("Enter Your National Id") || "Please enter your National ID");
      return;
    }

    if (linkedInNationalId.length !== 14 || !/^\d+$/.test(linkedInNationalId)) {
      alert("National ID must be exactly 14 digits");
      return;
    }

    try {
      console.log("Getting LinkedIn auth URL with National ID:", linkedInNationalId);
      
      // Get LinkedIn auth URL with National ID
      const res = await fetch(`http://localhost:5005/alumni-portal/auth/linkedin?nationalId=${linkedInNationalId}`);
      const data = await res.json();

      console.log("LinkedIn auth URL response:", data);

      if (data.status === "success" && data.data?.authUrl) {
        console.log("Redirecting to LinkedIn:", data.data.authUrl);
        // Close the modal first
        setShowNidModal(false);
        // Clear any existing tokens to ensure fresh login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Small delay to ensure modal closes, then redirect to LinkedIn OAuth
        setTimeout(() => {
          window.location.href = data.data.authUrl;
        }, 100);
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
    <>
      <button
        type="button"
        className="linkedin-btn"
        onClick={handleLinkedInLogin}
      >
        <FaLinkedin size={18} color="#0A66C2" />
        Sign up with LinkedIn
      </button>

      {/* National ID Modal (same as Google signup) */}
      {showNidModal && (
        <div className="nid-overlay">
          <div className="nid-box">
            <h3>{t("Enter Your National Id")}</h3>

            <input
              type="number"
              className="nid-input"
              value={linkedInNationalId}
              onChange={(e) => setLinkedInNationalId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLinkedInNidSubmit()}
              placeholder="Enter your 14-digit National ID"
              maxLength={14}
            />

            <button className="nid-submit" onClick={handleLinkedInNidSubmit}>
              {t("confirm")}
            </button>

            <button className="nid-close" onClick={() => setShowNidModal(false)}>
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LinkedInSignUp;
