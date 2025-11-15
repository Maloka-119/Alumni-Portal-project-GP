import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DarkModeProvider } from './pages/alumni/DarkModeContext';
import Register from './auth/Register';
import Login from './auth/Login';
import AlumniPortal from './pages/alumni/AlumniPortal';
import AdminPanel from './pages/admin/AdminPanel';
import StaffDashboard from './pages/staff/StaffDashboard';
import ProtectedRoute from './routes/ProtectedRoute';
import LinkedInSignUp from './auth/LinkedInSignUp';
import LinkedInCallback from './auth/LinkedInCallback';

function App() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <Router>
      <DarkModeProvider>
        <Routes>
          {/* Auth */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup/linkedin" element={<LinkedInSignUp />} />
          <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />

          {/* Protected */}
          <Route path="/admin/dashboard/*" element={
            <ProtectedRoute user={user} requiredRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="/staff/dashboard" element={
            <ProtectedRoute user={user} requiredRole="staff">
              <StaffDashboard />
            </ProtectedRoute>
          } />
          <Route path="/graduate/dashboard" element={
            <ProtectedRoute user={user} requiredRole="graduate">
              <AlumniPortal />
            </ProtectedRoute>
          } />
        </Routes>
      </DarkModeProvider>
    </Router>
  );
}

export default App;


// {/* <Router>
//         <DarkModeProvider>
//           <Routes>
//             <Route path="/helwan-alumni-portal/register" element={<Register />} />
//             <Route path="/helwan-alumni-portal/login" element={<Login />} />
//             <Route path="/helwan-alumni-portal/admin/dashboard" element={<AdminPanel />} />
//             <Route path="/helwan-alumni-portal/alumni/dashboard" element={<AlumniPortal />} />
//           </Routes>
//         </DarkModeProvider>
//       </Router> */}