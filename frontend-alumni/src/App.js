import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DarkModeProvider } from './pages/alumni/DarkModeContext';
import Register from './auth/Register';
import AdminPanel from './pages/admin/AdminPanel';
import Login from './auth/Login';
import AlumniPortal from './pages/alumni/AlumniPortal';

  function App() {  

    return (
      <div className="App">
        <Router>
        <DarkModeProvider>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admindashboard" element={<AdminPanel />} />
            <Route path="/alumnidashboard" element={<AlumniPortal />} />
          </Routes>
        </DarkModeProvider>
      </Router>
      </div>
      );
  }

 export default App;