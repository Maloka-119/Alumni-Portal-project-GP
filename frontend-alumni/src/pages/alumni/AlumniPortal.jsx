import React, { useState, useRef } from 'react';
import { 
  Home, User, FileText, Bell, IdCard,
  Users, Network, Briefcase,
  File, MessageSquare, HelpCircle,
  Menu, X, LogOut, Globe, Moon, Sun, ChevronDown, ChevronUp
} from 'lucide-react';
import './AlumniPortal.css';
import UniLogo from './Uni Logo.jpeg';
import Footer from '../../components/Footer';
import AlumniAdminPosts from './AlumniAdminPosts';
import PostsAlumni from './PostsAlumni';
import HomeAlumni from './HomeAlumni';
import DigitalID from './DigitalID';
import GraduatedProfile from './GraduatedProfile';
import ExploreGroups from './ExploreGroups.js';
import MyGroups from './MyGroups';
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';
import API from "../../services/api";


const sidebarSections = (darkMode, t) => [
  {
    title: t("personal"),
    items: [
      { name: t("home"), key: "Home", icon: <Home size={18}/> },
      { name: t("profile"), key: "Profile", icon: <User size={18}/> },
      { name: t("myPosts"), key: "My Posts", icon: <FileText size={18}/> },
      { name: t("notifications"), key: "Notifications", icon: <Bell size={18}/> },
      { name: t("digitalId"), key: "Digital ID", icon: <IdCard size={18}/> }
    ]
  },
  {
    title: t("networksOpportunities"),
    items: [
      { name: t("peopleFriends"), key: "People & Friends", icon: <Users size={18}/> },
      { name: t("communities"), key: "Communities", icon: <Network size={18}/>, isDropdown: true },
      { name: t("opportunities"), key: "Opportunities", icon: <Briefcase size={18}/> }
    ]
  },
  {
    title: t("servicesSupport"),
    items: [
      { name: t("documentRequests"), key: "Document Requests", icon: <File size={18}/> },
      { name: t("consultations"), key: "Consultations", icon: <MessageSquare size={18}/> },
      { name: t("faqHelp"), key: "FAQ & Help", icon: <HelpCircle size={18}/> },
    ]
  },
  {
    title: t("manageAccount"),
    items: [
      { 
        name: darkMode ? t("lightMode") : t("darkMode"), 
        icon: darkMode ? <Sun size={18}/> : <Moon size={18}/>, 
        action: "toggleDark" 
      },
      { name: t("language"), icon: <Globe size={18}/>, action: "language" },
      { name: t("logout"), icon: <LogOut size={18}/>, action: "logout" }
    ]
  },
];


const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activePage, setActivePage] = useState("Home"); 
  const [communitiesOpen, setCommunitiesOpen] = useState(false);
  const footerRef = useRef(null);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const scrollToFooter = () => {
    footerRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const handleSidebarAction = async (action) => {
    if(action === "toggleDark") setDarkMode(!darkMode);
    if(action === "logout") {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await API.post("/logout", {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(res.data.message);
        }
      } catch (err) {
        console.error("Logout failed:", err);
      } finally {
        localStorage.removeItem("user"); 
        localStorage.removeItem("token"); 
        navigate('/helwan-alumni-portal/login', { replace: true });
      }
    }
  
    if(action === "language") {
      const newLang = i18n.language === "en" ? "ar" : "en";
      i18n.changeLanguage(newLang);
    }
    if(action === "contact") scrollToFooter();
  }

  const renderContent = () => {
    if(activePage === "Home") return <HomeAlumni darkMode={darkMode}/>;
    if(activePage === "Opportunities") return <AlumniAdminPosts darkMode={darkMode}/>;
    if(activePage === "My Posts") return <PostsAlumni darkMode={darkMode}/>;
    if(activePage === "Digital ID") return <DigitalID darkMode={darkMode}/>;
    if(activePage === "Profile") return <GraduatedProfile darkMode={darkMode}/>;
    if(activePage === "all Communities") return <ExploreGroups darkMode={darkMode}/>;
    if(activePage === "my Communities") return <MyGroups darkMode={darkMode}/>;

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
          {sidebarSections(darkMode, t).map((section, index) => (
            <div className="alumni-sidebar-section" key={index}>
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item, i) => (
                  <React.Fragment key={i}>
                    <li 
                      className={`alumni-sidebar-item ${activePage===item.key?"active":""}`}
                      onClick={()=>{
                        if(item.isDropdown) {
                          setCommunitiesOpen(!communitiesOpen);
                        } else if(item.action) {
                          handleSidebarAction(item.action);
                        } else {
                          setActivePage(item.key);
                        }
                      }}
                    >
                      {item.icon} {item.name} 
                      {item.isDropdown && (communitiesOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>)}
                    </li>
                    {item.isDropdown && communitiesOpen && (
                      <ul className="alumni-sidebar-submenu">
                        <li 
                          className={`alumni-sidebar-subitem ${activePage==="all Communities"?"active":""}`}
                          onClick={()=>setActivePage("all Communities")}
                        >
                           {t("allCommunities")}
                        </li>
                        <li 
                          className={`alumni-sidebar-subitem ${activePage==="my Communities"?"active":""}`}
                          onClick={()=>setActivePage("my Communities")}
                        >
                          {t("myCommunities")}
                        </li>
                      </ul>
                    )}
                  </React.Fragment>
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


// import React, { useState, useRef } from 'react';
// import { 
//   Home, User, FileText, Bell, IdCard,
//   Users, Network, Briefcase,
//   File, MessageSquare, HelpCircle,
//   Menu, X, LogOut, Globe, Moon, Sun
// } from 'lucide-react';
// import './AlumniPortal.css';
// import UniLogo from './Uni Logo.jpeg';
// import Footer from '../../components/Footer';
// import AlumniAdminPosts from './AlumniAdminPosts';
// import PostsAlumni from './PostsAlumni';
// import HomeAlumni from './HomeAlumni';
// import DigitalID from './DigitalID';
// import GraduatedProfile from './GraduatedProfile';
// import { useTranslation } from "react-i18next";
// import { useNavigate } from 'react-router-dom';
// import API from "../../services/api";


// const sidebarSections = (darkMode, t) => [
//   {
//     title: t("personal"),
//     items: [
//       { name: t("home"), key: "Home", icon: <Home size={18}/> },
//       { name: t("profile"), key: "Profile", icon: <User size={18}/> },
//       { name: t("myPosts"), key: "My Posts", icon: <FileText size={18}/> },
//       { name: t("notifications"), key: "Notifications", icon: <Bell size={18}/> },
//       { name: t("digitalId"), key: "Digital ID", icon: <IdCard size={18}/> }
//     ]
//   },
//   {
//     title: t("networksOpportunities"),
//     items: [
//       { name: t("peopleFriends"), key: "People & Friends", icon: <Users size={18}/> },
//       { name: t("communities"), key: "Communities", icon: <Network size={18}/> },
//       { name: t("opportunities"), key: "Opportunities", icon: <Briefcase size={18}/> }
//     ]
//   },
//   {
//     title: t("servicesSupport"),
//     items: [
//       { name: t("documentRequests"), key: "Document Requests", icon: <File size={18}/> },
//       { name: t("consultations"), key: "Consultations", icon: <MessageSquare size={18}/> },
//       { name: t("faqHelp"), key: "FAQ & Help", icon: <HelpCircle size={18}/> },
//     ]
//   },
//   {
//     title: t("manageAccount"),
//     items: [
//       { 
//         name: darkMode ? t("lightMode") : t("darkMode"), 
//         icon: darkMode ? <Sun size={18}/> : <Moon size={18}/>, 
//         action: "toggleDark" 
//       },
//       { name: t("language"), icon: <Globe size={18}/>, action: "language" },
//       { name: t("logout"), icon: <LogOut size={18}/>, action: "logout" }
//     ]
//   },
// ];


// const Dashboard = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [darkMode, setDarkMode] = useState(false);
//   const [activePage, setActivePage] = useState("Home"); 
//   const footerRef = useRef(null);
//   const { t, i18n } = useTranslation();
//   const navigate = useNavigate();

//   const scrollToFooter = () => {
//     footerRef.current?.scrollIntoView({ behavior: "smooth" });
//   }

//   const handleSidebarAction = async (action) => {
//     if(action === "toggleDark") setDarkMode(!darkMode);
//     if(action === "logout") {
//       try {
//         const token = localStorage.getItem("token");
//         if (token) {
//           const res = await API.post("/logout", {}, {
//             headers: { Authorization: `Bearer ${token}` }
//           });
//           console.log(res.data.message); // "Logged out successfully"
//         }
//       } catch (err) {
//         console.error("Logout failed:", err);
//       } finally {
//         localStorage.removeItem("user"); 
//         localStorage.removeItem("token"); 
//         navigate('/helwan-alumni-portal/login', { replace: true });
//       }
//     }
  
//     if(action === "language") {
//       const newLang = i18n.language === "en" ? "ar" : "en";
//       i18n.changeLanguage(newLang);
//     }
//     if(action === "contact") scrollToFooter();
//   }

//   const renderContent = () => {
//     if(activePage === "Home") return <HomeAlumni darkMode={darkMode}/>;
//   if(activePage === "Opportunities") return <AlumniAdminPosts darkMode={darkMode}/>;
//   if(activePage === "My Posts") return <PostsAlumni darkMode={darkMode}/>;
//   if(activePage === "Digital ID") return <DigitalID darkMode={darkMode}/>;
//   if(activePage === "Profile") return <GraduatedProfile darkMode={darkMode}/>;

//   return (
//     <div className="alumni-card">
//       <h2>{activePage}</h2>
//       <p>Content for {activePage}</p>
//     </div>
//     )
//   }

//   return (
//     <div className={darkMode ? "dark" : "light"}>
//       {/* Header */}
//       <header className={`page-header ${darkMode ? "header-dark" : ""}`}>
//         <div className="header-left">
//           <button className="alumni-menu-btn" onClick={() => setIsOpen(!isOpen)}>
//             {isOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>
//           <img src={UniLogo} alt="University Logo" className="logo-placeholder" />
//           <h1 className="portal-name">Helwan Alumni Portal</h1>
//         </div>
//         <div className="alumni-header-right">
//           <button className="header-btn" onClick={()=>setActivePage("Notifications")}>
//             <Bell size={18}/> 
//           </button>
//           <button className="header-btn" onClick={()=>setActivePage("Profile")}>
//             <User size={18}/> 
//           </button>
//         </div>
//       </header>

//       {/* Layout */}
//       <div className="alumni-layout">
//         <aside className={`alumni-sidebar ${isOpen ? "open" : "closed"}`}>
//           {sidebarSections(darkMode, t).map((section, index) => (
//             <div className="alumni-sidebar-section" key={index}>
//               <h3>{section.title}</h3>
//               <ul>
//                 {section.items.map((item, i) => (
//                   <li 
//                   key={i} 
//                   className={`alumni-sidebar-item ${activePage===item.key?"active":""}`}
//                   onClick={()=>{
//                     if(item.action) handleSidebarAction(item.action);
//                     else setActivePage(item.key)
//                   }}
//                 >
//                   {item.icon} {item.name}
//                 </li>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </aside>

//         <main className="alumni-main-content">
//           {renderContent()}
//         </main>
//       </div>

//       <Footer ref={footerRef}/>
//     </div>
//   );
// };

// export default Dashboard;
