
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import "./chatList.css";

export default function ChatList({ onSelectChat, darkMode }) {
  const [chats] = useState([
    {
      chat_id: 1,
      friend: {
        id: 1,
        "first-name": "John",
        "last-name": "Doe",
        email: "john.doe@example.com",
        "user-type": "graduate",
        "profile-pic": "https://i.pravatar.cc/50?img=1",
      },
      last_message: {
        content: "Hey Yara! How’s it going?",
        created_at: "2025-10-11T10:15:00Z",
        unread_count: 2,
      },
    },
    {
      chat_id: 2,
      friend: {
        id: 2,
        "first-name": "Sara",
        "last-name": "Ali",
        email: "sara.ali@example.com",
        "user-type": "student",
        "profile-pic": "https://i.pravatar.cc/50?img=5",
      },
      last_message: {
        content: "See you tomorrow!",
        created_at: "2025-10-10T18:22:00Z",
        unread_count: 0,
      },
    },
  ]);

  return (
    <div className={`chatlist-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="chatlist-header">
        <MessageSquare size={18} />
        <h2>Chats</h2>
      </div>

      {chats.map((chat) => (
        <div
          key={chat.chat_id}
          className="chat-item"
          onClick={() => onSelectChat(chat)}
        >
          <img
            src={chat.friend["profile-pic"]}
            alt="profile"
            className="chat-avatar"
          />

          <div className="chat-info">
            <div className="chat-top">
              <span className="chat-name">
                {chat.friend["first-name"]} {chat.friend["last-name"]}
              </span>
              <span className="chat-time">
                {new Date(chat.last_message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="chat-bottom">
              <span className="chat-preview">
                {chat.last_message.content.length > 25
                  ? chat.last_message.content.slice(0, 25) + "..."
                  : chat.last_message.content}
              </span>
              {chat.last_message.unread_count > 0 && (
                <span className="unread-badge">
                  {chat.last_message.unread_count}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
