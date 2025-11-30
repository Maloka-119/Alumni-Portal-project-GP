import React, { useState, useEffect } from "react";
import ChatList from "./chatList";
import Chat from "./chat";
import { useTranslation } from "react-i18next";
import "./ChatSidebar.css";

export default function ChatSidebar({ darkMode, chatOpen, setChatOpen, chatId, activeChatFriend }) {
  const { i18n } = useTranslation();
  const [selectedChat, setSelectedChat] = useState(null);

  // ------------------ Set selected chat when chatId or friendData changes ------------------
  useEffect(() => {
    if (!chatId || !activeChatFriend) return;
    setSelectedChat({ chatId, friend: activeChatFriend });
  }, [chatId, activeChatFriend]);

  const handleSelectChat = (chat) => setSelectedChat(chat);
  const handleBackToList = () => setSelectedChat(null);

  return (
    <div
      className={`chat-sidebar ${chatOpen ? "open" : ""} ${
        i18n.language === "ar" ? "rtl" : "ltr"
      } ${darkMode ? "dark" : ""}`}
    >
      {!selectedChat ? (
        <ChatList darkMode={darkMode} onSelectChat={handleSelectChat} />
      ) : (
        <Chat darkMode={darkMode} chat={selectedChat} />
      )}
    </div>
  );
}



// import React from "react";
// import ChatList from "./chatList";
// import { X } from "lucide-react";
// import './AlumniPortal.css';

// export default function ChatSidebar({ darkMode, chatOpen, setChatOpen }) {
//   return (
//     <div className={`chat-sidebar ${chatOpen ? "open" : ""}`}>
//       <div className="chat-header">
        
//         <button onClick={() => setChatOpen(false)} className="close-chat">
//           <X size={18} />
//         </button>
//       </div>

//       <ChatList darkMode={darkMode} />
//     </div>
//   );
// }
