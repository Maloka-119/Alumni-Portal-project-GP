import React, { useState } from 'react';
import { 
  LogOut, 
  User, 
  Menu, 
  X
} from 'lucide-react';
import './StaffDashboard.css';

// الصفحات
import AlumniManagement from '../admin/AlumniManagement';
import AdminPostsPage from '../admin/AdminPostsPage';
import EmptyPage from '../admin/EmptyPage';
import StaffManagement from '../admin/StaffManagement';
import UsersPostsPage from '../admin/UsersPostsPage';

// تعريف الصفحات
const pagesConfig = {
  'Reports & Analysis': <EmptyPage title="Reports & Analysis" />,
  'Community Management': <EmptyPage title="Community Management" />,
  'Document Management': <EmptyPage title="Document Management" />,
  'Consultation Requests': <EmptyPage title="Consultation Requests" />,
  'Alumni Management': <AlumniManagement />,
  'Staff Management': <StaffManagement/>,
  'Permissions & Roles': <EmptyPage title="Permissions & Roles" />,
  'Admin Posts': <AdminPostsPage/>,
  'Users Posts': <UsersPostsPage/>,
  'FAQ Manage': <EmptyPage title="FAQ Manage" />,
};

// صلاحيات الأدوار
const rolePermissions = {
  admin: {
    'Reports & Analysis': ['view', 'edit', 'delete'],
    'Community Management': ['view', 'edit', 'delete'],
    'Staff Management': ['view', 'edit'],
    'Permissions & Roles': ['view', 'edit'],
    'Admin Posts': ['view', 'edit', 'delete']
  },
  staff: {
    'Reports & Analysis': ['view'],
    'Community Management': ['view', 'edit'],
    'Users Posts': ['view', 'edit'],
    'FAQ Manage': ['view']
  },
  alumni: {
    'Users Posts': ['view', 'create'],
    'FAQ Manage': ['view']
  }
};

const StaffDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activePage, setActivePage] = useState(null);

  // المستخدم الحالي
  const currentUser = {
    username: "john.doe",
    nationalId: "1234567890",
    workId: "EMP001",
    email: "john.doe@company.com",
    role: "staff" // admin | staff | alumni
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfile = () => setProfileOpen(!profileOpen);
  const handleLogout = () => alert('Logging out...');
  const handleNavigation = (pageName) => {
    setActivePage(pageName);
    setSidebarOpen(false);
  };

  const availablePages = Object.keys(rolePermissions[currentUser.role] || {});

  return (
    <div className={`dashboard-root ${sidebarOpen ? 'sidebar-visible' : ''}`}>
      {/* Header */}
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
          
          {profileOpen && (
            <div className="profile-menu">
              <div className="profile-details">
                <div className="profile-item">
                  <span className="profile-label">Username</span>
                  <span className="profile-value">{currentUser.username}</span>
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
                  <span className="profile-label">Role</span>
                  <span className="profile-value">{currentUser.role}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay-panel ${sidebarOpen ? 'show' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className="sidebar-panel">
        <nav className="sidebar-nav">
          {availablePages.map((pageName, index) => (
            <button
              key={index}
              className={`sidebar-item ${activePage === pageName ? 'active' : ''}`}
              onClick={() => handleNavigation(pageName)}
            >
              {pageName}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-section">
        <div className="content-container">
          {!activePage ? (
            <div className="welcome-box">
              <h2 className="welcome-heading">Welcome back, {currentUser.username}!</h2>
              <p className="welcome-text">
                Use the sidebar to navigate to different sections.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="welcome-heading">{activePage}</h2>
              {pagesConfig[activePage] || <p>Page not found</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
