// Dashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, User, FileText, Bell, IdCard,
  Users, Network, Briefcase,
  File, MessageSquare, HelpCircle, MessageCircle, Clipboard,
  Menu, X, LogOut, Globe, Moon, Sun, ChevronDown, ChevronUp
} from 'lucide-react';
import './AlumniPortal.css';
import UniLogo from '../../components/logo-white-deskt-min.png';
import AlumniAdminPosts from './AlumniAdminPosts';
import PostsAlumni from './PostsAlumni';
import HomeAlumni from './HomeAlumni';
import DigitalID from './DigitalID';
import GraduatedProfile from './GraduatedProfile';
import ExploreGroups from './exploreGroups';
import MyGroups from './MyGroups';
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import ViewFAQ from './ViewFAQ';
import Notifications from './Notifications.js';
import ChatSidebar from './ChatSidebar.jsx';
import FriendshipPage from './FriendShipp.js';
import EmptyPage from '../admin/EmptyPage';
import Accountgrad from "./Accountgrad.jsx";
import FeedbackPage from './FeedbackPage.jsx';

const BASE_PATH = "/helwan-alumni-portal/graduate/dashboard";

// الأقسام في sidebar
const sidebarSections = (darkMode, t) => [
  {
    title: t("personal"),
    items: [
      { name: t("home"), key: "home", icon: <Home size={18}/> },
      { name: t("profile"), key: "profile", icon: <User size={18}/> },
      { name: t("myPosts"), key: "my-posts", icon: <FileText size={18}/> },
      { name: t("notifications"), key: "notifications", icon: <Bell size={18}/> },
      { name: t("digitalId"), key: "digital-id", icon: <IdCard size={18}/> }
    ]
  },
  {
    title: t("networksOpportunities"),
    items: [
      { name: t("peopleFriends"), key: "friends", icon: <Users size={18}/> },
      { name: t("communities"), key: "communities", icon: <Network size={18}/>, isDropdown: true },
      { name: t("opportunities"), key: "opportunities", icon: <Briefcase size={18}/> }
    ]
  },
  {
    title: t("servicesSupport"),
    items: [
      { name: t("documentRequests"), key: "documents", icon: <File size={18}/> },
      { name: t("consultations"), key: "consultations", icon: <MessageSquare size={18}/> },
      { name: t("faqHelp"), key: "faq", icon: <HelpCircle size={18}/> },
      { name: t("feedbackSuggestions"), key: "feedback", icon: <Clipboard size={18}/> }
    ]
  },
  {
    title: t("manageAccount"),
    items: [
      { name: darkMode ? t("lightMode") : t("darkMode"), icon: darkMode ? <Sun size={18}/> : <Moon size={18}/>, action: "toggleDark" },
      { name: t("language"), icon: <Globe size={18}/>, action: "language" },
      { name: t("logout"), icon: <LogOut size={18}/>, action: "logout" }
    ]
  },
];

const Dashboard = ({ setUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [communitiesOpen, setCommunitiesOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null); // ID الشات المفتوح
  const [friendRequestUserId, setFriendRequestUserId] = useState(null); // ID طلب الصداقة المفتوح
  const [friendshipTab, setFriendshipTab] = useState("friends"); // تحديد التبويب الافتراضي في FriendshipPage
  const footerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  // تحديث اتجاه الصفحة حسب اللغة
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const handleSidebarAction = async (action) => {
    if(action === "toggleDark") setDarkMode(!darkMode);
    if(action === "logout") {
      try {
        const token = localStorage.getItem("token");
        if(token) {
          await API.get("/logout", { headers: { Authorization: `Bearer ${token}` } });
        }
      } catch(err) {
        console.error("Logout failed:", err);
      } finally {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate('/helwan-alumni-portal/login', { replace: true });
      }
    }
    if(action === "language") i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
  }

  const handleMenuClick = (key) => {
    if(key === "communities") setCommunitiesOpen(!communitiesOpen);
    else navigate(`${BASE_PATH}/${key}`);
  }

  const getActiveKey = () => location.pathname.split("/").pop();
  const activeKey = getActiveKey();

  // فتح Chat Pop-up
  const openChatSidebar = (id) => {
    setChatId(id);
    setChatOpen(true);
  };

  // فتح Friend Request Pop-up + تحديد تبويب Requests
  const openFriendRequestSidebar = (userId) => {
    setFriendshipTab("requests");  // يفتح تبويب Requests
    navigate(`${BASE_PATH}/friends`);
    setFriendRequestUserId(userId);
  };

  return (
    <div className={darkMode ? "dark" : "light"}>
      {/* Header */}
      <header className={`page-header ${darkMode ? "header-dark" : ""}`}>
        <div className="header-left">
          <button className="alumni-menu-btn" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
          <img src={UniLogo} alt="University Logo" className="logoo-placeholder" />
          <h1 className="portal-name">Helwan Alumni Portal</h1>
        </div>
        <div className="alumni-header-right">
          <button className="header-btn" onClick={() => navigate(`${BASE_PATH}/notifications`)}>
            <Bell size={18}/> 
          </button>
          <button className="header-btn" onClick={() => setChatOpen(!chatOpen)}>
            <MessageCircle size={18}/> 
          </button>
          <button className="header-btn" onClick={() => navigate(`${BASE_PATH}/profile`)}>
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
                      className={`alumni-sidebar-item ${activeKey===item.key?"active":""}`}
                      onClick={() => item.action ? handleSidebarAction(item.action) : handleMenuClick(item.key)}
                    >
                      {item.icon} {item.name} 
                      {item.isDropdown && (communitiesOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>)}
                    </li>
                    {item.isDropdown && communitiesOpen && (
                      <ul className="alumni-sidebar-submenu">
                        <li 
                          className={`alumni-sidebar-subitem ${activeKey==="all"?"active":""}`}
                          onClick={()=>navigate(`${BASE_PATH}/communities/all`)}
                        >{t("allCommunities")}</li>
                        <li 
                          className={`alumni-sidebar-subitem ${activeKey==="my"?"active":""}`}
                          onClick={()=>navigate(`${BASE_PATH}/communities/my`)}
                        >{t("myCommunities")}</li>
                      </ul>
                    )}
                  </React.Fragment>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        <main className="alumni-main-content">
          {/* Pop-up الشات */}
          <ChatSidebar 
            darkMode={darkMode} 
            chatOpen={chatOpen} 
            setChatOpen={setChatOpen} 
            chatId={chatId} 
          />

          {/* Routes */}
          <Routes>
            <Route index element={<HomeAlumni darkMode={darkMode}/>} />
            <Route path="home" element={<HomeAlumni darkMode={darkMode}/>} />
            <Route path="profile" element={<GraduatedProfile darkMode={darkMode}/>} />
            <Route path="my-posts" element={<PostsAlumni darkMode={darkMode}/>} />
            <Route path="digital-id" element={<DigitalID darkMode={darkMode}/>} />
            <Route path="opportunities" element={<AlumniAdminPosts darkMode={darkMode}/>} />
            <Route path="communities/all" element={<ExploreGroups darkMode={darkMode}/>} />
            <Route path="communities/my" element={<MyGroups darkMode={darkMode}/>} />
            <Route path="faq" element={<ViewFAQ darkMode={darkMode}/>} />
            <Route 
              path="notifications" 
              element={<Notifications 
                darkMode={darkMode} 
                openChat={openChatSidebar} 
                openFriendRequest={openFriendRequestSidebar} 
              />} 
            />
            <Route path="friends" element={<FriendshipPage darkMode={darkMode} tab={friendshipTab}/>} />
            <Route path="friends/:userId" element={<Accountgrad darkMode={darkMode}/>} />
            <Route path="documents" element={<EmptyPage title="Document Requests" />} />
            <Route path="Consultations" element={<EmptyPage title="Consultation Requests" />} />
            <Route path="feedback" element={<FeedbackPage darkMode={darkMode}/>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

// import React, { useState, useEffect, useRef } from 'react';
// import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
// import { 
//   Home, User, FileText, Bell, IdCard,
//   Users, Network, Briefcase,
//   File, MessageSquare, HelpCircle, MessageCircle, Clipboard,
//   Menu, X, LogOut, Globe, Moon, Sun, ChevronDown, ChevronUp
// } from 'lucide-react';
// import './AlumniPortal.css';
// import UniLogo from '../../components/logo-white-deskt-min.png';
// import Footer from '../../components/Footer'; 
// import AlumniAdminPosts from './AlumniAdminPosts';
// import PostsAlumni from './PostsAlumni';
// import HomeAlumni from './HomeAlumni';
// import DigitalID from './DigitalID';
// import GraduatedProfile from './GraduatedProfile';
// import ExploreGroups from './exploreGroups';
// import MyGroups from './MyGroups';
// import { useTranslation } from "react-i18next";
// import API from "../../services/api";
// import ViewFAQ from './ViewFAQ';
// import Notifications from './Notifications.js';
// import ChatSidebar from './ChatSidebar.jsx';
// import FriendshipPage from './FriendShipp.js';
// import EmptyPage from '../admin/EmptyPage';
// import Accountgrad from "./Accountgrad.jsx";
// import FeedbackPage from './FeedbackPage.jsx';
// import Tour from '../../components/Tour';
// import '../../components/Tour.css';

// const BASE_PATH = "/helwan-alumni-portal/graduate/dashboard";

// const sidebarSections = (darkMode, t) => [
//   {
//     title: t("personal"),
//     items: [
//       { name: t("home"), key: "home", icon: <Home size={18}/>, dataTour: "home" },
//       { name: t("profile"), key: "profile", icon: <User size={18}/>, dataTour: "profile" },
//       { name: t("myPosts"), key: "my-posts", icon: <FileText size={18}/>, dataTour: "my-posts" },
//       { name: t("notifications"), key: "notifications", icon: <Bell size={18}/>, dataTour: "notifications" },
//       { name: t("digitalId"), key: "digital-id", icon: <IdCard size={18}/>, dataTour: "digital-id" }
//     ]
//   },
//   {
//     title: t("networksOpportunities"),
//     items: [
//       { name: t("peopleFriends"), key: "friends", icon: <Users size={18}/>, dataTour: "friends" },
//       { name: t("communities"), key: "communities", icon: <Network size={18}/>, isDropdown: true,dataTour: "communities" },
//       { name: t("opportunities"), key: "opportunities", icon: <Briefcase size={18}/>,dataTour: "opportunities" }
//     ]
//   },
//   {
//     title: t("servicesSupport"),
//     items: [
//       { name: t("documentRequests"), key: "documents", icon: <File size={18}/>, dataTour: "documents" },
//       { name: t("consultations"), key: "consultations", icon: <MessageSquare size={18}/>, dataTour: "consultations" },
//       { name: t("faqHelp"), key: "faq", icon: <HelpCircle size={18}/>, dataTour: "faq" },
//       { name: t("feedbackSuggestions"), key: "feedback", icon: <Clipboard size={18}/>, dataTour: "feedback" }
//     ]
//   },
//   {
//     title: t("manageAccount"),
//     items: [
//       { name: darkMode ? t("lightMode") : t("darkMode"), icon: darkMode ? <Sun size={18}/> : <Moon size={18}/>, action: "toggleDark" },
//       { name: t("language"), icon: <Globe size={18}/>, action: "language" },
//       { name: t("logout"), icon: <LogOut size={18}/>, action: "logout" }
//     ]
//   },
// ];

// const tourSteps = [
//   { selector: 'home', messageKey: 'tourHome' },
//   { selector: 'profile', messageKey: 'tourProfile' },
//   { selector: 'my-posts', messageKey: 'tourMyPosts' },
//   { selector: 'notifications', messageKey: 'tourNotifications' },
//   { selector: 'digital-id', messageKey: 'tourDigitalID' },
//   { selector: 'friends', messageKey: 'tourFriends' },
//   { selector: 'communities', messageKey: 'tourCommunities' },
//   { selector: 'opportunities', messageKey: 'tourOpportunities' },
//   { selector: 'documents', messageKey: 'tourDocuments' },
//   { selector: 'consultations', messageKey: 'tourConsultations' },
//   { selector: 'faq', messageKey: 'tourFAQ' },
//   { selector: 'feedback', messageKey: 'tourFeedback' }
// ];


// const Dashboard = ({ setUser }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [darkMode, setDarkMode] = useState(false);
//   const [communitiesOpen, setCommunitiesOpen] = useState(false);
//   const [chatOpen, setChatOpen] = useState(false);
//   const footerRef = useRef(null);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { t, i18n } = useTranslation();
//   const sidebarRef = useRef(null);

//   useEffect(() => {
//     document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
//   }, [i18n.language]);

//   const handleSidebarAction = async (action) => {
//     if(action === "toggleDark") setDarkMode(!darkMode);
//     if(action === "logout") {
//       try {
//         const token = localStorage.getItem("token");
//         if(token) await API.get("/logout", { headers: { Authorization: `Bearer ${token}` } });
//       } catch(err) { console.error(err); }
//       finally {
//         localStorage.removeItem("user");
//         localStorage.removeItem("token");
//         navigate('/helwan-alumni-portal/login', { replace: true });
//       }
//     }
//     if(action === "language") i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
//   }

//   const handleMenuClick = (key) => {
//     if(key === "communities") setCommunitiesOpen(!communitiesOpen);
//     else navigate(`${BASE_PATH}/${key}`);
//   }

//   const getActiveKey = () => {
//     const parts = location.pathname.split("/");
//     return parts[parts.length - 1];
//   }
//   const activeKey = getActiveKey();

//   return (
//     <div className={darkMode ? "dark" : "light"}>
//       <header className={`page-header ${darkMode ? "header-dark" : ""}`}>
//         <div className="header-left">
//           <button className="alumni-menu-btn" onClick={() => setIsOpen(!isOpen)}>
//             {isOpen ? <X size={24}/> : <Menu size={24}/>}
//           </button>
//           <img src={UniLogo} alt="University Logo" className="logoo-placeholder" />
//           <h1 className="portal-name">Helwan Alumni Portal</h1>
//         </div>
//         <div className="alumni-header-right">
//           <button className="header-btn" onClick={() => navigate(`${BASE_PATH}/notifications`)}>
//             <Bell size={18}/> 
//           </button>
//           <button className="header-btn" onClick={() => setChatOpen(!chatOpen)}>
//             <MessageCircle size={18}/> 
//           </button>
//           <button className="header-btn" onClick={() => navigate(`${BASE_PATH}/profile`)}>
//             <User size={18}/> 
//           </button>
//         </div>
//       </header>

//       <div className="alumni-layout">
//       <aside ref={sidebarRef} className={`alumni-sidebar ${isOpen ? "open" : "closed"}`}>
//           {sidebarSections(darkMode, t).map((section, index) => (
//             <div className="alumni-sidebar-section" key={index}>
//               <h3>{section.title}</h3>
//               <ul>
//                 {section.items.map((item, i) => (
//                   <React.Fragment key={i}>
//                     <li 
//                       className={`alumni-sidebar-item ${activeKey===item.key?"active":""}`}
//                       onClick={() => item.action ? handleSidebarAction(item.action) : handleMenuClick(item.key)}
//                       data-tour={item.dataTour ? item.dataTour : undefined}
//                     >
//                       {item.icon} {item.name} 
//                       {item.isDropdown && (communitiesOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>)}
//                     </li>
//                     {item.isDropdown && communitiesOpen && (
//                       <ul className="alumni-sidebar-submenu">
//                         <li className={`alumni-sidebar-subitem ${activeKey==="all"?"active":""}`} onClick={()=>navigate(`${BASE_PATH}/communities/all`)}>{t("allCommunities")}</li>
//                         <li className={`alumni-sidebar-subitem ${activeKey==="my"?"active":""}`} onClick={()=>navigate(`${BASE_PATH}/communities/my`)}>{t("myCommunities")}</li>
//                       </ul>
//                     )}
//                   </React.Fragment>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </aside>

//         <main className="alumni-main-content">
//           <ChatSidebar darkMode={darkMode} chatOpen={chatOpen} setChatOpen={setChatOpen} />
//           <Routes>
//             <Route index element={<HomeAlumni darkMode={darkMode}/>} />
//             <Route path="home" element={<HomeAlumni darkMode={darkMode}/>} />
//             <Route path="profile" element={<GraduatedProfile darkMode={darkMode}/>} />
//             <Route path="my-posts" element={<PostsAlumni darkMode={darkMode}/>} />
//             <Route path="digital-id" element={<DigitalID darkMode={darkMode}/>} />
//             <Route path="opportunities" element={<AlumniAdminPosts darkMode={darkMode}/>} />
//             <Route path="communities/all" element={<ExploreGroups darkMode={darkMode}/>} />
//             <Route path="communities/my" element={<MyGroups darkMode={darkMode}/>} />
//             <Route path="faq" element={<ViewFAQ darkMode={darkMode}/>} />
//             <Route path="notifications" element={<Notifications darkMode={darkMode}/>} />
//             <Route path="friends" element={<FriendshipPage />} />
//             <Route path="friends/:userId" element={<Accountgrad />} />
//             <Route path="documents" element={<EmptyPage title="Document Requests" />} />
//             <Route path="Consultations" element={<EmptyPage title="Consultation Requests" />} />
//             <Route path="feedback" element={<FeedbackPage />} />
//           </Routes>
//         </main>
//       </div>

//       <Tour 
//   steps={tourSteps} 
//   sidebarOpen={isOpen} 
//   sidebarRef={sidebarRef} 
//   darkMode={darkMode} 
// />
//       {/* <Footer ref={footerRef}/> */}
//     </div>
//   );
// };

// export default Dashboard;
