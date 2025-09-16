import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, requiredRole, children }) => {
  if (!user) {
    // لو مش مسجل دخول
    return <Navigate to="/helwan-alumni-portal/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // لو الرول مش مطابق
    return <Navigate to="/helwan-alumni-portal/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
