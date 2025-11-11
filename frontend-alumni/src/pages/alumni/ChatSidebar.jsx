import React, { useState } from "react";
import ChatList from "./chatList";
import Chat from "./chat";
import { X ,ArrowLeft } from "lucide-react";
import "./ChatSidebar.css";

export default function ChatSidebar({ darkMode, chatOpen, setChatOpen }) {
  const [selectedChat, setSelectedChat] = useState(null);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };
  const handleBackToList = () => {
    setSelectedChat(null);
  };

  return (
    <div className={`chat-sidebar ${chatOpen ? "open" : ""}`}>
      {/* <div className="sidechat-header">
      {selectedChat ? (
          <button onClick={handleBackToList} className="back-chat">
            <ArrowLeft size={18} />
          </button>
        ) : (
          <button onClick={() => setChatOpen(false)} className="close-chat">
          <X size={18} />
        </button>
        )}
        
      </div> */}

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
