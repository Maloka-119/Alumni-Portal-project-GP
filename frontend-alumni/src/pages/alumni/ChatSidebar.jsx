import React, { useState, useEffect } from "react";
import ChatList from "./chatList";
import Chat from "./chat";
import { useTranslation } from "react-i18next";
import "./ChatSidebar.css";

export default function ChatSidebar({ darkMode, chatOpen, setChatOpen, chatId, activeChatFriend }) {
  const { i18n } = useTranslation();
  const [selectedChat, setSelectedChat] = useState(null);


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


