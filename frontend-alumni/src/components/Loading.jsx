import React from "react";
import { ClipLoader } from "react-spinners";

const Loading = ({ message = "Loading...", size = 50, color = "#4f46e5" }) => {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "60vh",
      flexDirection: "column",
      gap: "10px"
    }}>
      <ClipLoader color={color} size={size} />
      <span style={{ color, fontWeight: "500" }}>{message}</span>
    </div>
  );
};

export default Loading;
