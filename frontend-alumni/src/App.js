import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DarkModeProvider } from './pages/alumni/DarkModeContext';
import Register from './auth/Register';
import AdminPanel from './pages/admin/AdminPanel';
import Login from './auth/Login';
import AlumniPortal from './pages/alumni/AlumniPortal';
import ProtectedRoute from './routes/ProtectedRoute';
import StaffDashboard from './pages/staff/StaffDashboard'

  function App() {  
    const user = JSON.parse(localStorage.getItem('user'));

    return (
      <div className="App">
      <Router>
  <DarkModeProvider>
    <Routes>
      <Route path="/helwan-alumni-portal/register" element={<Register />} />
      <Route path="/helwan-alumni-portal/login" element={<Login />} />

      <Route 
        path="/helwan-alumni-portal/admin/dashboard" 
        element={
          <ProtectedRoute user={user} requiredRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/helwan-alumni-portal/staff/dashboard" 
        element={
          <ProtectedRoute user={user} requiredRole="staff">
            <StaffDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/helwan-alumni-portal/alumni/dashboard"
        element={
          <ProtectedRoute user={user} requiredRole="graduate">
            <AlumniPortal />
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