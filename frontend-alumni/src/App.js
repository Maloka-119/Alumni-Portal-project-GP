import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DarkModeProvider } from "./pages/alumni/DarkModeContext";
import Register from "./auth/Register";
import AdminPanel from "./pages/admin/AdminPanel";
import Login from "./auth/Login";
import AlumniPortal from "./pages/alumni/AlumniPortal";
import ProtectedRoute from "./routes/ProtectedRoute";
import StaffDashboard from "./pages/staff/StaffDashboard";
import LandingPage from "./pages/Landing/LandingPage";
import LinkedInCallback from "./auth/LinkedInCallback";
import LinkedInSignUp from "./auth/LinkedInSignUp";
import Loading from "./components/Loading";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";
import PublicGraduateProfile from './pages/alumni/PublicGraduateProfile.jsx';
import CompleteRegistration from "./auth/CompleteRegistration.jsx"; 

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <Loading message="Loading..." />;
  }

  return (
    <div className="App">
      <Router>
        <DarkModeProvider>
          <Routes>
            {/* إعادة توجيه الصفحة الرئيسية */}
            <Route path="/" element={<Navigate to="/helwan-alumni-portal" />} />

            {/* صفحات عامة */}
            <Route path="/helwan-alumni-portal" element={<LandingPage />} />
            <Route path="/helwan-alumni-portal/register" element={<Register />} />
            <Route path="/helwan-alumni-portal/login" element={<Login setUser={setUser} />} />
            
            {/* مسار إكمال تسجيل جوجل - أضف هذا السطر */}
            <Route path="/helwan-alumni-portal/complete-registration" element={<CompleteRegistration setUser={setUser} />} />

            <Route
              path="/helwan-alumni-portal/public-graduate/:graduationId"
              element={<PublicGraduateProfile />}
            />

            {/* LinkedIn routes */}
            <Route path="/helwan-alumni-portal/auth/linkedin/signup" element={<LinkedInSignUp />} />
            <Route
  path="/auth/linkedin/callback"
  element={<LinkedInCallback setUser={setUser} />}
/>


            {/* صفحات محمية */}
            <Route
              path="/helwan-alumni-portal/admin/dashboard/*"
              element={
                <ProtectedRoute user={user} requiredRole="admin">
                  <AdminPanel setUser={setUser} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/helwan-alumni-portal/staff/dashboard/*"
              element={
                <ProtectedRoute user={user} requiredRole="staff">
                  <StaffDashboard setUser={setUser} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/helwan-alumni-portal/graduate/dashboard/*"
              element={
                <ProtectedRoute user={user} requiredRole="graduate">
                  <AlumniPortal setUser={setUser} />
                </ProtectedRoute>
              }
            />

            {/* صفحات إعادة تعيين كلمة المرور */}
            <Route
              path="/helwan-alumni-portal/forgot-password"
              element={<ForgotPassword />}
            />
            <Route
              path="/helwan-alumni-portal/reset-password"
              element={<ResetPassword />}
            />

            {/* أي مسار غير معروف يعيد للتسجيل/اللاندنج */}
            <Route path="*" element={<Navigate to="/helwan-alumni-portal" />} />
          </Routes>
        </DarkModeProvider>
      </Router>
    </div>
  );
}

export default App;