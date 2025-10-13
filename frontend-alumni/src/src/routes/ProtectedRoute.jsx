import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, requiredRole, children }) => {
  if (!user) {
    // لو المستخدم مش مسجل دخول
    return <Navigate to="/helwan-alumni-portal/login" replace />;
  }

  if (requiredRole && user.userType !== requiredRole) {
    // لو نوع المستخدم مش نفس الـ role المطلوب
    return <Navigate to="/helwan-alumni-portal/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

