import React from "react";
import { FcGoogle } from "react-icons/fc";

const GoogleLoginButton = ({ onClick, text }) => {
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
      <FcGoogle size={24} />
      {text || "Sign in with Google"}
    </button>
  );
};

export default GoogleLoginButton;
