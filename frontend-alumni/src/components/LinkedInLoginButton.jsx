import React from "react";
import { FaLinkedin } from "react-icons/fa";

const LinkedInLoginButton = ({ onClick, text }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 20px",
        background: "#0A66C2",
        color: "#ffffff",
        border: "1px solid #0A66C2",
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
        e.currentTarget.style.background = "#004182";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#0A66C2";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      }}
    >
      <FaLinkedin size={24} />
      {text || "Sign in with LinkedIn"}
    </button>
  );
};

export default LinkedInLoginButton;

