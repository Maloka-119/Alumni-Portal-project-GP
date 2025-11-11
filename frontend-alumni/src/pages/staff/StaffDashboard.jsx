// StaffDashboard.jsx
import React, { useState, useEffect } from "react";
import { LogOut, User, Menu, X } from "lucide-react";
import "./StaffDashboard.css";
import API from "../../services/api";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { modulesConfig } from "../../components/modulePermissions";
import { getPermission } from "../../components/usePermission";
import EmptyPage from "../admin/EmptyPage";

const StaffDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await API.get("/staff/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.status === "success") {
          const staffProfile = { ...res.data.data, roles: res.data.data.roles || [] };
          setCurrentUser(staffProfile);
          localStorage.setItem("currentUser", JSON.stringify(staffProfile));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfile = () => setProfileOpen(!profileOpen);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/helwan-alumni-portal/login");
  };

  if (loading) return <div className="dashboard-root"><p>Loading profile...</p></div>;

  const activePath = location.pathname.split("/").pop();

  const renderSidebar = () => {
    return modulesConfig.map((module) => {
      const modulePerm = getPermission(module.permKey, currentUser);
      let canViewParent = modulePerm.canView;

      if (module.children) {
        for (let child of module.children) {
          const childPerm = getPermission(child.permKey, currentUser);
          if (childPerm.canView) {
            canViewParent = true;
            break;
          }
        }
      }
      if (!canViewParent) return null;

      return (
        <div key={module.path} className="sidebar-module">
          <button
  className={`sidebar-link ${activePath === module.path ? "active" : ""}`}
  onClick={() => navigate(`/helwan-alumni-portal/staff/dashboard/${module.path}`, { replace: true })}
>
  {module.name}
</button>

{module.children && module.children.map((child) => {
  const childPerm = getPermission(child.permKey, currentUser);
  if (!childPerm.canView) return null;
  return (
    <button
      key={child.path}
      className={`sidebar-link child-link ${activePath === child.path ? "active" : ""}`}
      onClick={() => navigate(`/helwan-alumni-portal/staff/dashboard/${module.path}/${child.path}`, { replace: true })}
    >
      {child.name}
    </button>
  );
})}

        </div>
      );
    });
  };

  const renderRoutes = () => {
    return modulesConfig.map((module) => {
      const ModuleComponent = module.component || EmptyPage;
      const modulePerm = getPermission(module.permKey, currentUser);
  
      let canViewParent = modulePerm.canView;
      if (module.children) {
        for (let child of module.children) {
          const childPerm = getPermission(child.permKey, currentUser);
          if (childPerm.canView) {
            canViewParent = true;
            break;
          }
        }
      }
      if (!canViewParent) return null;
  
      if (!module.children) {
        return (
          <Route
            key={module.path}
            path={module.path}
            element={<ModuleComponent currentUser={currentUser} />}
          />
        );
      } else {
        return (
          <Route
            key={module.path}
            path={module.path}
            element={<ModuleComponent currentUser={currentUser} />}
          >
            {module.children.map((child) => {
              const childPerm = getPermission(child.permKey, currentUser);
              if (!childPerm.canView) return null;
              const ChildComponent = child.component || EmptyPage;
              return (
                <Route
                  key={child.path}
                  path={child.path}
                  element={<ChildComponent currentUser={currentUser} />}
                />
              );
            })}
          </Route>
        );
      }
    });
  };
  

  return (
    <div className={`dashboard-root ${sidebarOpen ? "sidebar-visible" : ""}`}>
      <header className="header-bar">
        <div className="header-section-left">
          <button className="menu-toggle-btn" onClick={toggleSidebar}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="header-title-text">Staff Control Panel</h1>
        </div>
        <div className="header-section-right">
          <button className="icon-action-btn" onClick={handleLogout}><LogOut size={20} /></button>
          <button className="icon-action-btn" onClick={toggleProfile}><User size={20} /></button>
          {profileOpen && currentUser && (
            <div className="profile-menu">
              <div className="profile-details">
                <div className="profile-item">
                  <span className="profile-label">Username</span>
                  <span className="profile-value">{currentUser.fullName}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">National ID</span>
                  <span className="profile-value">{currentUser.nationalId}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Work ID</span>
                  <span className="profile-value">{currentUser.workId}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{currentUser.email}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Roles</span>
                  <span className="profile-value">
                    {currentUser.roles.length > 0
                      ? currentUser.roles.map(r => r.name).join(", ")
                      : "No roles assigned"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <aside className="sidebar-panel">
        <nav>{renderSidebar()}</nav>
      </aside>

      <main className="main-section">
        <Routes>
          {renderRoutes()}
          <Route path="*" element={<EmptyPage title="Welcome" />} />
          
        </Routes>
      </main>
    </div>
  );
};

export default StaffDashboard;



// import React, { useState, useEffect } from 'react'
// import { LogOut, User, Menu, X } from 'lucide-react'
// import './StaffDashboard.css'
// import API from '../../services/api'
// import { useNavigate } from 'react-router-dom';


// const StaffDashboard = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(false)
//   const [profileOpen, setProfileOpen] = useState(false)
//   const [currentUser, setCurrentUser] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchProfile = async () => {
//       const token = localStorage.getItem('token')
//       if (!token) {
//         setLoading(false)
//         return
//       }

//       try {
//         const res = await API.get('/staff/profile', {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         })

//         if (res.data.status === 'success') {
//           setCurrentUser({
//             username: res.data.data.fullName,
//             nationalId: res.data.data.nationalId,
//             workId: res.data.data.workId,
//             email: res.data.data.email,
//             roles: res.data.data.roles || [],
//           })
//         }
//       } catch (err) {
//         console.error('Error fetching profile:', err)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchProfile()
//   }, [])

//   const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
//   const toggleProfile = () => setProfileOpen(!profileOpen)
//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     navigate('/helwan-alumni-portal/login');
//   }

//   if (loading) {
//     return (
//       <div className="dashboard-root">
//         <div className="loading-screen">
//           <p>Loading profile...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className={`dashboard-root ${sidebarOpen ? 'sidebar-visible' : ''}`}>
//       <header className="header-bar">
//         <div className="header-section-left">
//           <button className="menu-toggle-btn" onClick={toggleSidebar}>
//             {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
//           </button>
//           <h1 className="header-title-text">Staff Control Panel</h1>
//         </div>

//         <div className="header-section-right">
//           <button className="icon-action-btn" onClick={handleLogout}>
//             <LogOut size={20} />
//           </button>
//           <button className="icon-action-btn" onClick={toggleProfile}>
//             <User size={20} />
//           </button>

//           {profileOpen && currentUser && (
//             <div className="profile-menu">
//               <div className="profile-details">
//                 <div className="profile-item">
//                   <span className="profile-label">Username</span>
//                   <span className="profile-value">{currentUser.username}</span>
//                 </div>
//                 <div className="profile-item">
//                   <span className="profile-label">National ID</span>
//                   <span className="profile-value">{currentUser.nationalId}</span>
//                 </div>
//                 <div className="profile-item">
//                   <span className="profile-label">Work ID</span>
//                   <span className="profile-value">{currentUser.workId}</span>
//                 </div>
//                 <div className="profile-item">
//                   <span className="profile-label">Email</span>
//                   <span className="profile-value">{currentUser.email}</span>
//                 </div>
//                 <div className="profile-item">
//                   <span className="profile-label">Roles</span>
//                   <span className="profile-value">
//                     {currentUser.roles.length > 0
//                       ? currentUser.roles.join(', ')
//                       : 'No roles assigned'}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </header>

//       <div
//         className={`sidebar-overlay-panel ${sidebarOpen ? 'show' : ''}`}
//         onClick={() => setSidebarOpen(false)}
//       />

//       <aside className="sidebar-panel">
//         <nav className="sidebar-nav">
//           <p style={{ padding: '1rem', color: '#888' }}>Sidebar empty</p>
//         </nav>
//       </aside>

//       <main className="main-section">
//         <div className="content-container">
//           {currentUser ? (
//             <div className="welcome-box">
//               <h2 className="welcome-heading">
//                 Welcome back, {currentUser.username}!
//               </h2>
//               <p className="welcome-text">Profile loaded successfully.</p>
//             </div>
//           ) : (
//             <div className="welcome-box">
//               <h2 className="welcome-heading">Welcome back!</h2>
//               <p className="welcome-text">Unable to load your profile.</p>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   )
// }

// export default StaffDashboard
