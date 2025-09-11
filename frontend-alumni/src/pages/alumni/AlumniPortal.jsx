import React, { useState, useRef } from 'react';
import { 
  Home, User, FileText, Bell, IdCard,
  Users, Network, Briefcase,
  File, MessageSquare, HelpCircle,
  Menu, X, LogOut, Globe, Moon, Sun
} from 'lucide-react';
import './AlumniPortal.css';
import UniLogo from './Uni Logo.jpeg';
import Footer from '../../components/Footer';
import AlumniAdminPosts from './AlumniAdminPosts';
import PostsAlumni from './PostsAlumni';
import HomeAlumni from './HomeAlumni';
import DigitalID from './DigitalID';
import GraduatedProfile from './GraduatedProfile';

const sidebarSections = (darkMode) => [
  {
    title: "Personal",
    items: [
      { name: "Home", icon: <Home size={18}/> },
      { name: "Profile", icon: <User size={18}/> },
      { name: "My Posts", icon: <FileText size={18}/> },
      { name: "Notifications", icon: <Bell size={18}/> },
      { name: "Digital ID", icon: <IdCard size={18}/> }
    ]
  },
  {
    title: "Networks & Opportunities",
    items: [
      { name: "People & Friends", icon: <Users size={18}/> },
      { name: "Communities", icon: <Network size={18}/> },
      { name: "Opportunities", icon: <Briefcase size={18}/> }
    ]
  },
  {
    title: "Services & Support",
    items: [
      { name: "Document Requests", icon: <File size={18}/> },
      { name: "Consultations", icon: <MessageSquare size={18}/> },
      { name: "FAQ & Help", icon: <HelpCircle size={18}/> },
    ]
  },
  {
    title: "Manage Account",
    items: [
      { 
        name: darkMode ? "Light Mode" : "Dark Mode", 
        icon: darkMode ? <Sun size={18}/> : <Moon size={18}/>, 
        action: "toggleDark" 
      },
      { name: "Language", icon: <Globe size={18}/>, action: "language" },
      { name: "Logout", icon: <LogOut size={18}/>, action: "logout" }
    ]
  },
];

const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activePage, setActivePage] = useState("Home"); 
  const footerRef = useRef(null);

  const scrollToFooter = () => {
    footerRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const handleSidebarAction = (action) => {
    if(action === "toggleDark") setDarkMode(!darkMode);
    if(action === "logout") console.log("Logout action");
    if(action === "language") console.log("Change language");
    if(action === "contact") scrollToFooter();
  }

  const renderContent = () => {
    if(activePage === "Home") {
      return <HomeAlumni darkMode={darkMode}/>;
    }

    if(activePage === "Opportunities") {
      return <AlumniAdminPosts darkMode={darkMode}/>;
    }

    if(activePage === "My Posts") {
      return <PostsAlumni darkMode={darkMode}/>;
    }

    if(activePage === "Digital ID") {
      return <DigitalID darkMode={darkMode}/>;
    }

    if(activePage === "Profile") {
      return <GraduatedProfile darkMode={darkMode}/>;
    }

   

    // باقي الصفحات
    return (
      <div className="alumni-card">
        <h2>{activePage}</h2>
        <p>Content for {activePage}</p>
      </div>
    )
  }

  return (
    <div className={darkMode ? "dark" : "light"}>
      {/* Header */}
      <header className={`page-header ${darkMode ? "header-dark" : ""}`}>
        <div className="header-left">
          <button className="alumni-menu-btn" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <img src={UniLogo} alt="University Logo" className="logo-placeholder" />
          <h1 className="portal-name">Helwan Alumni Portal</h1>
        </div>
        <div className="alumni-header-right">
          <button className="header-btn" onClick={()=>setActivePage("Notifications")}>
            <Bell size={18}/> 
          </button>
          <button className="header-btn" onClick={()=>setActivePage("Profile")}>
            <User size={18}/> 
          </button>
        </div>
      </header>

      {/* Layout */}
      <div className="alumni-layout">
        <aside className={`alumni-sidebar ${isOpen ? "open" : "closed"}`}>
          {sidebarSections(darkMode).map((section, index) => (
            <div className="alumni-sidebar-section" key={index}>
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item, i) => (
                  <li 
                    key={i} 
                    className={`alumni-sidebar-item ${activePage===item.name?"active":""}`}
                    onClick={()=>{
                      if(item.action) handleSidebarAction(item.action);
                      else setActivePage(item.name)
                    }}
                  >
                    {item.icon} {item.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        <main className="alumni-main-content">
          {renderContent()}
        </main>
      </div>

      <Footer ref={footerRef}/>
    </div>
  );
};

export default Dashboard;
