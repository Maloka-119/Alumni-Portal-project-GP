import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, requiredRole, children }) => {
  console.log("user:", user);
  console.log("requiredRole:", requiredRole);

  if (!user) {
    return <Navigate to="/helwan-alumni-portal/login" replace />;
  }

  if (requiredRole && user.userType !== requiredRole) {
    console.warn("Role mismatch -> redirecting to login");
    return <Navigate to="/helwan-alumni-portal/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
