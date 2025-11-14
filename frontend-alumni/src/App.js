import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { DarkModeProvider } from "./pages/alumni/DarkModeContext";
import Register from "./auth/Register";
import AdminPanel from "./pages/admin/AdminPanel";
import Login from "./auth/Login";
import AlumniPortal from "./pages/alumni/AlumniPortal";
import ProtectedRoute from "./routes/ProtectedRoute";
import StaffDashboard from "./pages/staff/StaffDashboard";
import LandingPage from "./pages/Landing/LandingPage";
import { Navigate } from "react-router-dom";
import Loading from "../src/components/Loading";

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
    return <Loading message="Loading communities..." />;
  }

  return (
    <div className="App">
      <Router>
        <DarkModeProvider>
          <Routes>
            {/* إعادة توجيه الصفحة الرئيسية للـ Landing */}
            <Route path="/" element={<Navigate to="/helwan-alumni-portal" />} />
            {/* صفحات عامة */}
            <Route path="/helwan-alumni-portal" element={<LandingPage />} />
            <Route
              path="/helwan-alumni-portal/register"
              element={<Register />}
            />
            <Route
              path="/helwan-alumni-portal/login"
              element={<Login setUser={setUser} />}
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
          </Routes>
        </DarkModeProvider>
      </Router>
    </div>
  );
}

export default App;
