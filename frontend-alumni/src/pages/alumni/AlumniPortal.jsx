// // Dashboard.jsx
// import React, { useEffect, useState } from 'react';
// import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
// import { 
//   Home, User, FileText, Bell, IdCard,
//   Users, Network, Briefcase,
//   File, MessageSquare, HelpCircle, Clipboard,
//   Menu, X, LogOut, Globe, Moon, Sun, ChevronDown, ChevronUp,
//   MessageCircle
// } from 'lucide-react';

// import './AlumniPortal.css';
// import UniLogo from '../../components/logo-white-deskt-min.png';

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
// import PostSingle from './PostSingle.jsx';
// import ChatBox from './ChatBox.jsx';

// const BASE_PATH = "/helwan-alumni-portal/graduate/dashboard";

// const sidebarSections = (darkMode, t) => [
//   {
//     title: t("personal"),
//     items: [
//       { name: t("home"), key: "home", icon: <Home size={18}/> },
//       { name: t("profile"), key: "profile", icon: <User size={18}/> },
//       { name: t("myPosts"), key: "my-posts", icon: <FileText size={18}/> },
//       { name: t("notifications"), key: "notifications", icon: <Bell size={18}/> },
//       { name: t("digitalId"), key: "digital-id", icon: <IdCard size={18}/> }
//     ]
//   },
//   {
//     title: t("networksOpportunities"),
//     items: [
//       { name: t("peopleFriends"), key: "friends", icon: <Users size={18}/> },
//       { name: t("communities"), key: "communities", icon: <Network size={18}/>, isDropdown: true },
//       { name: t("opportunities"), key: "opportunities", icon: <Briefcase size={18}/> }
//     ]
//   },
//   {
//     title: t("servicesSupport"),
//     items: [
//       { name: t("documentRequests"), key: "documents", icon: <File size={18}/> },
//       { name: t("consultations"), key: "consultations", icon: <MessageSquare size={18}/> },
//       { name: t("faqHelp"), key: "faq", icon: <HelpCircle size={18}/> },
//       { name: t("feedbackSuggestions"), key: "feedback", icon: <Clipboard size={18}/> }
//     ]
//   },
//   {
//     title: t("manageAccount"),
//     items: [
//       { name: darkMode ? t("lightMode") : t("darkMode"), icon: darkMode ? <Sun size={18}/> : <Moon size={18}/>, action: "toggleDark" },
//       { name: t("language"), icon: <Globe size={18}/>, action: "language" },
//       { name: t("logout"), icon: <LogOut size={18}/>, action: "logout" }
//     ]
//   }
// ];

// const Dashboard = ({ setUser }) => {

//   const [isOpen, setIsOpen] = useState(false);
//   const [darkMode, setDarkMode] = useState(false);
//   const [communitiesOpen, setCommunitiesOpen] = useState(false);
//   const [chatOpen, setChatOpen] = useState(false);
//   const [chatId, setChatId] = useState(null);
//   const [friendRequestUserId, setFriendRequestUserId] = useState(null);
//   const [friendshipTab, setFriendshipTab] = useState("friends");

//   const navigate = useNavigate();
//   const location = useLocation();
//   const { t, i18n } = useTranslation();

//   useEffect(() => {
//     document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
//   }, [i18n.language]);

//   // فتح الشات من النوتيفيكيشن → يفتح صفحة الشات مباشرة
//   const openChatFromNotification = (chatId, friendData) => {
//     navigate(`${BASE_PATH}/chat/${chatId}`, {
//       state: { friend: friendData }
//     });
//   };

//   // فتح طلبات الصداقة من النوتيفيكيشن
//   const openFriendRequestSidebarHandler = (userId) => {
//     setFriendshipTab("requests");
//     setFriendRequestUserId(userId);
//     navigate(`${BASE_PATH}/friends`);
//   };

//   // Actions
//   const handleSidebarAction = async (action) => {
//     if(action === "toggleDark") return setDarkMode(!darkMode);
//     if(action === "language") return i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");

//     if(action === "logout") {
//       try {
//         const token = localStorage.getItem("token");
//         if(token) 
//           await API.get("/logout", { headers: { Authorization: `Bearer ${token}` } });
//       } catch(err) {
//         console.error("Logout failed:", err);
//       } finally {
//         localStorage.removeItem("user");
//         localStorage.removeItem("token");
//         navigate('/helwan-alumni-portal/login', { replace: true });
//       }
//     }
//   };

//   const handleMenuClick = (key) => {
//     if(key === "communities") return setCommunitiesOpen(!communitiesOpen);
//     navigate(`${BASE_PATH}/${key}`);
//   };

//   const activeKey = location.pathname.split("/").pop();

//   return (
//     <div className={darkMode ? "dark" : "light"}>

//       {/* Header */}
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

//       {/* Layout */}
//       <div className="alumni-layout">

//         {/* Sidebar */}
//         <aside className={`alumni-sidebar ${isOpen ? "open" : "closed"}`}>
//           {sidebarSections(darkMode, t).map((section, index) => (
//             <div className="alumni-sidebar-section" key={index}>
//               <h3>{section.title}</h3>
//               <ul>
//                 {section.items.map((item, i) => (
//                   <React.Fragment key={i}>
//                     <li 
//                       className={`alumni-sidebar-item ${activeKey === item.key ? "active" : ""}`}
//                       onClick={() => item.action ? handleSidebarAction(item.action) : handleMenuClick(item.key)}
//                     >
//                       {item.icon} {item.name}
//                       {item.isDropdown && (communitiesOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>)}
//                     </li>

//                     {item.isDropdown && communitiesOpen && (
//                       <ul className="alumni-sidebar-submenu">
//                         <li 
//                           className={`alumni-sidebar-subitem ${activeKey==="all"?"active":""}`}
//                           onClick={() => navigate(`${BASE_PATH}/communities/all`)}
//                         >
//                           {t("allCommunities")}
//                         </li>
//                         <li 
//                           className={`alumni-sidebar-subitem ${activeKey==="my"?"active":""}`}
//                           onClick={() => navigate(`${BASE_PATH}/communities/my`)}
//                         >
//                           {t("myCommunities")}
//                         </li>
//                       </ul>
//                     )}
//                   </React.Fragment>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </aside>

//         {/* Main Content */}
//         <main className="alumni-main-content">

//           {/* Chat Sidebar */}
//           <ChatSidebar 
//             darkMode={darkMode} 
//             chatOpen={chatOpen} 
//             setChatOpen={setChatOpen} 
//             chatId={chatId} 
//           />

//           {/* Routes */}
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

//             {/* Notifications Route */}
//             <Route 
//               path="notifications" 
//               element={
//                 <Notifications 
//                   darkMode={darkMode}
//                   openChat={openChatFromNotification}
//                   openFriendRequest={openFriendRequestSidebarHandler}
//                 />
//               }
//             />

//             <Route path="friends" element={<FriendshipPage darkMode={darkMode} tab={friendshipTab} userId={friendRequestUserId}/>} />
//             <Route path="friends/:userId" element={<Accountgrad darkMode={darkMode}/>} />
//             <Route path="posts/:postId" element={<PostSingle />} />
//             <Route path="documents" element={<EmptyPage title="Document Requests" />} />
//             <Route path="consultations" element={<EmptyPage title="Consultation Requests" />} />
//             <Route path="feedback" element={<FeedbackPage darkMode={darkMode}/>} />

//             {/* Chat Page Wrapper */}
//             <Route path="chat/:chatId" element={<ChatPageWrapper darkMode={darkMode} />} />

//           </Routes>
//         </main>
//       </div>
//     </div>
//   );
// };

// // ================= ChatPageWrapper =================
// function ChatPageWrapper({ darkMode }) {
//   const { chatId } = useParams();
//   const location = useLocation();
//   const friendData = location.state?.friend || { fullName: "Unknown" };

//   return (
//     <ChatBox
//       chatId={chatId}
//       activeChatFriend={friendData}
//       darkMode={darkMode}
//       onClose={() => window.history.back()}
//     />
//   );
// }

// export default Dashboard;


import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Home, User, FileText, Bell, IdCard,
  Users, Network, Briefcase,
  File, MessageSquare, HelpCircle, Clipboard,
  Menu, X, LogOut, Globe, Moon, Sun, ChevronDown, ChevronUp,
  MessageCircle
} from 'lucide-react';

import './AlumniPortal.css';
import UniLogo from '../../components/logo-white-deskt-min.png';
import NewLogo from '../../capital-uni-logo.png'
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
import PostSingle from './PostSingle.jsx';
import ChatBox from './ChatBox.jsx';
import Swal from "sweetalert2";
import Services from './Services.jsx';

const BASE_PATH = "/helwan-alumni-portal/graduate/dashboard";




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
      { name: t("uniservices"), key: "uniservices", icon: < Clipboard size={18}/> },
      { name: t("faqHelp"), key: "faq", icon: <HelpCircle size={18}/> },
      { name: t("feedbackSuggestions"), key: "feedback", icon: < MessageSquare size={18}/> }
    ]
  },
  {
    title: t("manageAccount"),
    items: [
      { name: darkMode ? t("lightMode") : t("darkMode"), icon: darkMode ? <Sun size={18}/> : <Moon size={18}/>, action: "toggleDark" },
      { name: t("language"), icon: <Globe size={18}/>, action: "language" },
      { name: t("logout"), icon: <LogOut size={18}/>, action: "logout" }
    ]
  }
];

const Dashboard = ({ setUser }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [communitiesOpen, setCommunitiesOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [friendRequestUserId, setFriendRequestUserId] = useState(null);
  const [friendshipTab, setFriendshipTab] = useState("friends");

  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const acceptInvitation = async (invitationId) => {
    if (!invitationId) return console.error("Invitation id is missing");
    try {
      await API.post(
        `/invitations/${invitationId}/accept`,
        {},
        { headers: getAuthHeaders() } // تأكد إن دالة getAuthHeaders موجودة عندك
      );
    } catch (err) {
      console.error("Failed to accept invitation:", err);
    }
  };
  const fetchUnreadCount = async () => {
    try {
      const res = await API.get("/notifications/unread-count", { headers: getAuthHeaders() });
      setUnreadCount(res.data.count); // assuming backend returns { count: number }
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchUnreadCount();
  }, []);
  
  

  useEffect(() => {
    const checkInvitation = async () => {
      try {
        const response = await API.get("/invitations/auto/status");
        const data = response.data;

        if (data.invited && data.invitation?.status === "pending") {
          Swal.fire({
            title: t('Welcome to Helwan Alumni Portal!'),
            html: t(
              'You have been invited to join the group <strong>{{groupName}}</strong>. You can accept now or view it later in your Notifications.',
              { groupName: data.invitation.Group["group-name"] }
            ),
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: t('Accept'),
            cancelButtonText: t('Later')
          }).then(async (result) => {
            if (result.isConfirmed) {
              await acceptInvitation(data.invitation.id);
              navigate(`${BASE_PATH}/communities/my`);
            }
          });
        }
      } catch(err) {
        console.error("Failed to fetch invitation status:", err);
      }
    };

    checkInvitation();
  }, []);
  
  
  
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // فتح الشات من النوتيفيكيشن → يفتح صفحة الشات مباشرة
  const openChatFromNotification = (chatId, friendData) => {
    navigate(`${BASE_PATH}/chat/${chatId}`, {
      state: { friend: friendData }
    });
  };

  // فتح طلبات الصداقة من النوتيفيكيشن
  const openFriendRequestSidebarHandler = (userId) => {
    setFriendshipTab("requests");
    setFriendRequestUserId(userId);
    navigate(`${BASE_PATH}/friends`);
  };

  // Actions
  const handleSidebarAction = async (action) => {
    if(action === "toggleDark") return setDarkMode(!darkMode);
    if(action === "language") return i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");

    if(action === "logout") {
      try {
        const token = localStorage.getItem("token");
        if(token) 
          await API.get("/logout", { headers: { Authorization: `Bearer ${token}` } });
      } catch(err) {
        console.error("Logout failed:", err);
      } finally {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate('/helwan-alumni-portal/login', { replace: true });
      }
    }
  };

  const handleMenuClick = (key) => {
    if(key === "communities") return setCommunitiesOpen(!communitiesOpen);
    navigate(`${BASE_PATH}/${key}`);
  };

  const activeKey = location.pathname.split("/").pop();

  return (
    <div className={darkMode ? "dark" : "light"}>

      {/* Header */}
      <header className={`page-header ${darkMode ? "header-dark" : ""}`}>
        <div className="header-left">
          <button className="alumni-menu-btn" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
          {/* <img src={UniLogo} alt="University Logo" className="logoo-placeholder" />
          <h1 className="portal-name">Helwan Alumni Portal</h1> */}
          <img src={NewLogo} alt="University Logo" className="logoo-placeholder" />
          <h1 className="portal-name">{t("Capital Alumni Portal")}</h1>
        </div>

        <div className="alumni-header-right">
        <button 
  className="header-btn" 
  style={{ position: 'relative' }} // مهم
  onClick={() => navigate(`${BASE_PATH}/notifications`)}
>
  <Bell size={18} />
  {unreadCount > 0 && (
    <span style={{
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      backgroundColor: '#ff4d4f',
      color: 'white',
      borderRadius: '50%',
      padding: '2px 6px',
      fontSize: '12px',
      fontWeight: 'bold',
      minWidth: '18px',
      height: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {unreadCount}
    </span>
  )}
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

        {/* Sidebar */}
        <aside className={`alumni-sidebar ${isOpen ? "open" : "closed"}`}>
          {sidebarSections(darkMode, t).map((section, index) => (
            <div className="alumni-sidebar-section" key={index}>
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item, i) => (
                  <React.Fragment key={i}>
                    <li 
                      className={`alumni-sidebar-item ${activeKey === item.key ? "active" : ""}`}
                      onClick={() => item.action ? handleSidebarAction(item.action) : handleMenuClick(item.key)}
                    >
                      {item.icon} {item.name}
                      {item.isDropdown && (communitiesOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>)}
                    </li>

                    {item.isDropdown && communitiesOpen && (
                      <ul className="alumni-sidebar-submenu">
                        <li 
                          className={`alumni-sidebar-subitem ${activeKey==="all"?"active":""}`}
                          onClick={() => navigate(`${BASE_PATH}/communities/all`)}
                        >
                          {t("allCommunities")}
                        </li>
                        <li 
                          className={`alumni-sidebar-subitem ${activeKey==="my"?"active":""}`}
                          onClick={() => navigate(`${BASE_PATH}/communities/my`)}
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

        {/* Main Content */}
        <main className="alumni-main-content">

          {/* Chat Sidebar */}
          {chatOpen && (
  <ChatSidebar 
    darkMode={darkMode} 
    chatOpen={chatOpen} 
    setChatOpen={setChatOpen} 
    chatId={chatId} 
  />
)}


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

            {/* Notifications Route */}
            <Route 
              path="notifications" 
              element={
                <Notifications 
                  darkMode={darkMode}
                  openChat={openChatFromNotification}
                  setUnreadCount={setUnreadCount}
                  openFriendRequest={openFriendRequestSidebarHandler}
                />
              }
            />

            <Route path="friends" element={<FriendshipPage darkMode={darkMode} tab={friendshipTab} userId={friendRequestUserId}/>} />
            <Route path="friends/:userId" element={<Accountgrad darkMode={darkMode}/>} />
            <Route path="posts/:postId" element={<PostSingle />} />
            <Route path="documents" element={<EmptyPage title="Document Requests" />} />
            <Route path="uniservices" element={<Services />} />
            <Route path="feedback" element={<FeedbackPage darkMode={darkMode}/>} />

            {/* Chat Page Wrapper */}
            <Route path="chat/:chatId" element={<ChatPageWrapper darkMode={darkMode} />} />

          </Routes>
        </main>
      </div>
    </div>
  );
};

function ChatPageWrapper({ darkMode }) {
  const { chatId } = useParams();
  const location = useLocation();
  const friendData = location.state?.friend || { fullName: "Unknown" };

  return (
    <ChatBox
      chatId={chatId}
      activeChatFriend={friendData}
      darkMode={darkMode}
      onClose={() => window.history.back()}
    />
  );
}

export default Dashboard;