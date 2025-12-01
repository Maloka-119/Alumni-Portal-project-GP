// StaffDashboard.jsx
import React, { useState, useEffect } from "react";
import { LogOut, User, Menu, X } from "lucide-react";
import "./StaffDashboard.css";
import API from "../../services/api";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { modulesConfig } from "../../components/modulePermissions";
import { getPermission } from "../../components/usePermission";
import EmptyPage from "../admin/EmptyPage";
import { Globe } from "lucide-react"; 
import { useTranslation } from "react-i18next";

const StaffDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

const toggleLanguage = () => {
  const newLang = i18n.language === "en" ? "ar" : "en";
  i18n.changeLanguage(newLang);
};

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
    return modulesConfig.map(module => {
      const modulePerm = getPermission(module.permKey, currentUser, module.children || []);
      if (!modulePerm.canView) return null;
  
      return (
        <div key={module.path} className="sidebar-module">
          <button
            className={`sidebar-link ${activePath === module.path ? "active" : ""}`}
            onClick={() => navigate(`/helwan-alumni-portal/staff/dashboard/${module.path}`, { replace: true })}
          >
            {module.icon && <span className="sidebar-icon">{module.icon}</span>}
            <span>{module.name}</span>
          </button>
  
          {module.children && module.children.map(child => {
            const childPerm = getPermission(child.permKey, currentUser);
            if (!childPerm.canView) return null;
            return (
              <button
                key={child.path}
                className={`sidebar-link child-link ${activePath === child.path ? "active" : ""}`}
                onClick={() => navigate(`/helwan-alumni-portal/staff/dashboard/${module.path}/${child.path}`, { replace: true })}
              >
                {child.icon && <span className="sidebar-icon">{child.icon}</span>}
                <span>{child.name}</span>
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
    <div
  className={`dashboard-root ${sidebarOpen ? "sidebar-visible" : ""} ${i18n.language === "ar" ? "rtl" : "ltr"}`}
>

      <header className="header-bar">
        <div className="header-section-left">
          <button className="menu-toggle-btn" onClick={toggleSidebar}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="header-title-text">Staff Control Panel</h1>
        </div>
        <div className="header-section-right">
        <button className="icon-action-btn" onClick={toggleLanguage}><Globe size={20} /></button>
          <button className="icon-action-btn" onClick={toggleProfile}><User size={20} /></button>  
          <button className="icon-action-btn" onClick={handleLogout}><LogOut size={20} /></button>
          {profileOpen && currentUser && (
            <div className="profile-menu">
  <div className="profile-details">
    <div className="profile-item">
      <span className="profile-label">{t("Username")}</span>
      <span className="profile-value">{currentUser.fullName}</span>
    </div>
    <div className="profile-item">
      <span className="profile-label">{t("National ID")}</span>
      <span className="profile-value">{currentUser.nationalId}</span>
    </div>
    <div className="profile-item">
      <span className="profile-label">{t("Work ID")}</span>
      <span className="profile-value">{currentUser.workId}</span>
    </div>
    <div className="profile-item">
      <span className="profile-label">{t("Email")}</span>
      <span className="profile-value">{currentUser.email}</span>
    </div>
    <div className="profile-item">
      <span className="profile-label">{t("Roles")}</span>
      <span className="profile-value">
        {currentUser.roles.length > 0
          ? currentUser.roles.map(r => r.name).join(", ")
          : t("No roles assigned")}
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

