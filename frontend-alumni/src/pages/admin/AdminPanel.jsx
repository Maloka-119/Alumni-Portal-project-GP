

import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './AdminPanel.css';
import AlumniManagement from './AlumniManagement';
import AdminPostsPage from './AdminPostsPage';
import EmptyPage from './EmptyPage';
import StaffManagement from './StaffManagement';
import UsersPostsPage from './UsersPostsPage';
import GroupsPage from './GroupsPage';
import FAQManage from './FAQManage';
import RolesManagement from './RolesManagement';
import { 
  Globe, LogOut, BarChart2, Users, FileText, Phone, 
  UserCheck, User, Shield, Edit, Megaphone, HelpCircle, Wrench 
} from 'lucide-react';
import { useTranslation } from "react-i18next";

const AdminPanel = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
  };

  const menuSections = [
    {
      title: null,
      items: [
        { key: "reportsAnalysis", icon: <BarChart2 size={16} /> },
        { key: "communityManagement", icon: <Users size={16} /> },
        { key: "documentManagement", icon: <FileText size={16} /> },
        { key: "consultationRequests", icon: <Phone size={16} /> },
      ],
    },
    {
      title: "userManagement",
      items: [
        { key: "alumniManagement", icon: <UserCheck size={16} /> },
        { key: "staffManagement", icon: <User size={16} /> },
        { key: "permissionsRoles", icon: <Shield size={16} /> },
      ],
    },
    {
      title: "postsManagement",
      items: [
        { key: "adminPosts", icon: <Edit size={16} /> },
        { key: "usersPosts", icon: <Megaphone size={16} /> },
        { key: "faqManage", icon: <HelpCircle size={16} /> },
      ],
    },
  ];

  const handleMenuClick = (key) => {
    navigate(`/helwan-alumni-portal/admin/dashboard/${key}`);
  };

  return (
    <div className="admin-panel">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button
            className="menu-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>
          <div className="logo-section">
            <Wrench size={20} style={{ marginRight: '4px' }} />
            <span className="logo-text">{t("controlPanelTitle")}</span>
          </div>
        </div>

        <div className="header-right">
          <button className="lang-switch" onClick={toggleLanguage}>
            <Globe size={16} style={{ marginRight: '4px' }} />
            {i18n.language === "en" ? "EN" : "AR"}
          </button>
          <button className="logout-btn" onClick={() => navigate("/helwan-alumni-portal/login")}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          {menuSections.map((section, idx) => (
            <div key={idx} className="menu-section">
              {section.title && (
                <div className="section-title">{t(section.title)}</div>
              )}
              <nav className="navigation">
                {section.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleMenuClick(item.key)}
                    className="nav-item"
                  >
                    <span className="icon">{item.icon}</span>
                    <span>{t(item.key)}</span>
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <Routes>
        <Route index element={<EmptyPage title="welcome to admin panel" />} />

          <Route path="reportsAnalysis" element={<EmptyPage title="Reports & Analysis" />} />
          <Route path="communityManagement" element={<GroupsPage />} />
          <Route path="documentManagement" element={<EmptyPage title="Document Management" />} />
          <Route path="consultationRequests" element={<EmptyPage title="Consultation Requests" />} />
          <Route path="alumniManagement" element={<AlumniManagement />} />
          <Route path="staffManagement" element={<StaffManagement />} />
          <Route path="permissionsRoles" element={<RolesManagement />} />
          <Route path="adminPosts" element={<AdminPostsPage />} />
          <Route path="usersPosts" element={<UsersPostsPage />} />
          <Route path="faqManage" element={<FAQManage />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminPanel;

// import React, { useState } from 'react';
// import './AdminPanel.css';
// import AlumniManagement from './AlumniManagement';
// import AdminPostsPage from './AdminPostsPage';
// import EmptyPage from './EmptyPage';
// import StaffManagement from './StaffManagement';
// import UsersPostsPage from './UsersPostsPage';
// import { 
//   Globe, LogOut, BarChart2, Users, FileText, Phone, 
//   UserCheck, User, Shield, Edit, Megaphone, HelpCircle, Wrench 
// } from 'lucide-react';
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import GroupsPage from './GroupsPage';
// import FAQManage from './FAQManage';
// import RolesManagement from './RolesManagement';

// const pagesMap = {
//   reportsAnalysis: <EmptyPage title="Reports & Analysis" />,
//   communityManagement: <GroupsPage/>,
//   documentManagement: <EmptyPage title="Document Management" />,
//   consultationRequests: <EmptyPage title="Consultation Requests" />,
//   alumniManagement: <AlumniManagement />,
//   staffManagement: <StaffManagement />,
//   permissionsRoles: <RolesManagement />,
//   adminPosts: <AdminPostsPage />,
//   usersPosts: <UsersPostsPage />,
//   faqManage: <FAQManage />,
// };

// const AdminPanel = () => {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [activeItem, setActiveItem] = useState("reportsAnalysis");
//   const navigate = useNavigate();
//   const { t, i18n } = useTranslation();

//   const toggleLanguage = () => {
//     if (i18n.language === "en") {
//       i18n.changeLanguage("ar");
//     } else {
//       i18n.changeLanguage("en");
//     }
//   };

//   const menuSections = [
//     {
//       title: null,
//       items: [
//         { key: "reportsAnalysis", icon: <BarChart2 size={16} /> },
//         { key: "communityManagement", icon: <Users size={16} /> },
//         { key: "documentManagement", icon: <FileText size={16} /> },
//         { key: "consultationRequests", icon: <Phone size={16} /> },
//       ],
//     },
//     {
//       title: "userManagement",
//       items: [
//         { key: "alumniManagement", icon: <UserCheck size={16} /> },
//         { key: "staffManagement", icon: <User size={16} /> },
//         { key: "permissionsRoles", icon: <Shield size={16} /> },
//       ],
//     },
//     {
//       title: "postsManagement",
//       items: [
//         { key: "adminPosts", icon: <Edit size={16} /> },
//         { key: "usersPosts", icon: <Megaphone size={16} /> },
//         { key: "faqManage", icon: <HelpCircle size={16} /> },
//       ],
//     },
//   ];

//   return (
//     <div className="admin-panel">
//       {/* Header */}
//       <header className="header">
//         <div className="header-left">
//           <button
//             className="menu-btn"
//             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//           >
//             ☰
//           </button>
//           <div className="logo-section">
//             <Wrench size={20} style={{ marginRight: '4px' }} />
//             <span className="logo-text">{t("controlPanelTitle")}</span>
//           </div>
//         </div>

//         <div className="header-right">
//           <button className="lang-switch" onClick={toggleLanguage}>
//             <Globe size={16} style={{ marginRight: '4px' }} />
//             {i18n.language === "en" ? "EN" : "AR"}
//           </button>
//           <button className="logout-btn" onClick={() => navigate("/helwan-alumni-portal/login")}>
//             <LogOut size={16} />
//           </button>
//         </div>
//       </header>

//       {/* Sidebar */}
//       <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
//         <div className="sidebar-content">
//           {menuSections.map((section, idx) => (
//             <div key={idx} className="menu-section">
//               {section.title && (
//                 <div className="section-title">
//                   {t(section.title)}
//                 </div>
//               )}
//               <nav className="navigation">
//                 {section.items.map((item) => (
//                   <button
//                     key={item.key}
//                     onClick={() => setActiveItem(item.key)}
//                     className={`nav-item ${
//                       activeItem === item.key ? 'active' : ''
//                     }`}
//                   >
//                     <span className="icon">{item.icon}</span>
//                     <span>{t(item.key)}</span>
//                   </button>
//                 ))}
//               </nav>
//             </div>
//           ))}
//         </div>
//       </aside>

//       {/* Main Content */}
//       <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
//         {pagesMap[activeItem]}
//       </main>
//     </div>
//   );
// };

// export default AdminPanel;