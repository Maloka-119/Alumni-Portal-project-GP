import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom"; 
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
import PublicGraduateProfile from "./pages/alumni/PublicGraduateProfile.jsx";
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
      <DarkModeProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route
            path="/complete-registration"
            element={<CompleteRegistration setUser={setUser} />}
          />
          <Route
            path="/public-graduate/:graduationId"
            element={<PublicGraduateProfile />}
          />
       
          <Route path="/auth/linkedin/signup" element={<LinkedInSignUp />} />
          <Route
            path="/auth/linkedin/callback"
            element={<LinkedInCallback setUser={setUser} />}
          />
    
          <Route
            path="/admin/dashboard/*"
            element={
              <ProtectedRoute user={user} requiredRole="admin">
                <AdminPanel setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/dashboard/*"
            element={
              <ProtectedRoute user={user} requiredRole="staff">
                <StaffDashboard setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/graduate/dashboard/*"
            element={
              <ProtectedRoute user={user} requiredRole="graduate">
                <AlumniPortal setUser={setUser} />
              </ProtectedRoute>
            }
          />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </DarkModeProvider>
    </div>
  );
}

export default App;
