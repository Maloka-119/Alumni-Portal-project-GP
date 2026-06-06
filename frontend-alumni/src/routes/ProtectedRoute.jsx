import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, requiredRole, children }) => {


  if (!user) {
    return <Navigate to="/alumni-portal/login" replace />;
  }

  if (requiredRole && user.userType !== requiredRole) {
    console.warn("Role mismatch -> redirecting to login");
    return <Navigate to="/alumni-portal/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
