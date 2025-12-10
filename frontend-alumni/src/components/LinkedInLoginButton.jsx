import React from "react";
import { FaLinkedin } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const LinkedInLoginButton = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 20px",
        background: "#ffffff",
        color: "#202124",
        border: "1px solid #dadce0",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "500",
        width: "85%",
        justifyContent: "center",
        transition: "all 0.3s ease",
        margin: "20px auto 0 auto",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        fontSize: "16px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f7f7f7";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#ffffff";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      }}
    >
          <FaLinkedin size={24} color="#0A66C2" />
          {t("Sign in with LinkedIn")}
    </button>

  );
};

export default LinkedInLoginButton;

