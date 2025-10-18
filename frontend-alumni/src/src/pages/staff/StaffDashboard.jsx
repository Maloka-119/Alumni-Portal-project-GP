import React, { useState, useEffect } from 'react';
import { LogOut, User, Menu, X } from 'lucide-react';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('/staff/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized or network error');
        return res.json();
      })
      .then(data => {
        console.log("Profile API Response:", data);
        if (data.status === 'success' && data.data) {
          const userData = data.data;
          setCurrentUser({
            fullName: userData.fullName || "Unknown User",
            nationalId: userData.nationalId || "N/A",
            workId: userData.workId || "N/A",
            email: userData.email || "N/A",
            userType: userData.userType || "N/A",
            status: userData.status || "N/A",
            roles: Array.isArray(userData.roles)
              ? userData.roles.map(role => role.name)
              : []
          });
        }
      })
      .catch(err => console.error('Error fetching profile:', err))
      .finally(() => setLoading(false));
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfile = () => setProfileOpen(!profileOpen);
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="dashboard-root">
        <div className="loading-screen">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }
console.log("Current User:", currentUser);
console.log("Component rendered successfully without username field ✅");


  return (
    <div className={`dashboard-root ${sidebarOpen ? 'sidebar-visible' : ''}`}>
      
      <header className="header-bar">
        <div className="header-section-left">
          <button className="menu-toggle-btn" onClick={toggleSidebar}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="header-title-text">Staff Control Panel</h1>
        </div>

        <div className="header-section-right">
          <button className="icon-action-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
          <button className="icon-action-btn" onClick={toggleProfile}>
            <User size={20} />
          </button>

          {profileOpen && currentUser && (
            <div className="profile-menu">
              <div className="profile-details">
                <div className="profile-item">
                  <span className="profile-label">Full Name</span>
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
                  <span className="profile-label">User Type</span>
                  <span className="profile-value">{currentUser.userType}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Status</span>
                  <span className="profile-value">{currentUser.status}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Roles</span>
                  <span className="profile-value">
                    {currentUser.roles.length > 0
                      ? currentUser.roles.join(', ')
                      : 'No roles assigned'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div
        className={`sidebar-overlay-panel ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className="sidebar-panel">
        <nav className="sidebar-nav">
          <p style={{ padding: '1rem', color: '#888' }}>Sidebar empty</p>
        </nav>
      </aside>

      <main className="main-section">
        <div className="content-container">
          {currentUser && (
            <div className="welcome-box">
              <h2 className="welcome-heading">
                Welcome back, {currentUser.fullName || "Staff"}!
              </h2>
              <p className="welcome-text">Profile loaded successfully.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;


//konoz's code 
// import React, { useState, useEffect } from 'react';
// import { LogOut, User, Menu, X } from 'lucide-react';
// import './StaffDashboard.css';

// const StaffDashboard = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [profileOpen, setProfileOpen] = useState(false);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) return;

//     fetch('/staff/profile', {
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       }
//     })
//       .then(res => {
//         if (!res.ok) throw new Error('Unauthorized or network error');
//         return res.json();
//       })
//       .then(data => {
//         if(data.status === 'success') {
//           setCurrentUser({
//             username: data.data.fullName,
//             nationalId: data.data.nationalId,
//             workId: data.data.workId,
//             email: data.data.email,
//             roles: data.data.roles || []
//           });
//         }
//       })
//       .catch(err => console.error('Error fetching profile:', err))
//       .finally(() => setLoading(false));
//   }, []);

//   const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
//   const toggleProfile = () => setProfileOpen(!profileOpen);
//   const handleLogout = () => alert('Logging out...');

//   if (loading) {
//     return (
//       <div className="dashboard-root">
//         <div className="loading-screen">
//           <p>Loading profile...</p>
//         </div>
//       </div>
//     );
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
//           <p style={{padding: '1rem', color: '#888'}}>Sidebar empty</p>
//         </nav>
//       </aside>

//       <main className="main-section">
//         <div className="content-container">
//           <div className="welcome-box">
//             <h2 className="welcome-heading">Welcome back, {currentUser.username}!</h2>
//             <p className="welcome-text">
//               Profile loaded successfully.
//             </p>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default StaffDashboard;


