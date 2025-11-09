import { useState, useEffect } from "react";
import API from "../../services/api";
import ChatBox from "./ChatBox";
import "./chatList.css";

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  // ------------------ FETCH CHAT LIST ------------------
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await API.get("/chat/conversations");
        const normalizedChats = res.data.data.map((chat) => {
          const lastMsg = chat.last_message;
          let displayContent = "";
          if (lastMsg) {
            if (lastMsg.message_type === "image") displayContent = "[صورة]";
            else if (lastMsg.message_type === "pdf") displayContent = `[ملف PDF: ${lastMsg.file_name}]`;
            else if (lastMsg.message_type === "file") displayContent = `[ملف: ${lastMsg.file_name}]`;
            else displayContent = lastMsg.content || "";
          }
          return {
            ...chat,
            last_message: {
              ...chat.last_message,
              content: displayContent,
            },
          };
        });
        setChats(normalizedChats);
      } catch (err) {
        console.error("Fetch Chats Error:", err);
      }
    };
    fetchChats();
  }, []);

  // ------------------ UPDATE CHAT LIST ------------------
  const updateChatList = (updatedMsg) => {
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.chat_id !== updatedMsg.chat_id) return chat;

        // تحديد المحتوى الذي سيظهر في Chat List حسب نوع الرسالة
        let lastMsgText = updatedMsg.content || "";

        if (updatedMsg.message_type === "image") lastMsgText = "[صورة]";
        else if (updatedMsg.message_type === "pdf") lastMsgText = `[ملف PDF: ${updatedMsg.file_name}]`;
        else if (updatedMsg.message_type === "file") lastMsgText = `[ملف: ${updatedMsg.file_name}]`;

        return {
          ...chat,
          last_message: {
            ...chat.last_message,
            ...updatedMsg,
            content: lastMsgText,
          },
          unread_count: 0,
        };
      })
    );
  };

  // ------------------ OPEN CHAT ------------------
  const openChat = async (chat) => {
    setActiveChat(chat);

    // Reset unread count locally
    setChats((prevChats) =>
      prevChats.map((c) =>
        c.chat_id === chat.chat_id ? { ...c, unread_count: 0 } : c
      )
    );

    // Mark messages as read in backend
    try {
      await API.put(`/chat/${chat.chat_id}/read`);
    } catch (err) {
      console.error("Mark Messages as Read Error:", err);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-list">
        {chats.map((chat) => (
          <div
            key={chat.chat_id}
            className={`chat-item ${activeChat?.chat_id === chat.chat_id ? "selected" : ""}`}
            onClick={() => openChat(chat)}
          >
            <div className="chat-user-info">
              <img
                src={chat.other_user.avatar || "/default-avatar.png"}
                alt={chat.other_user.name}
                className="chat-avatar"
              />
              <div className="chat-text">
                <strong>{chat.other_user.name}</strong>
                <small>
                  {chat.last_message?.content || ""}
                  {chat.last_message_at && (
                    <span className="chat-time">
                      {" • " +
                        new Date(chat.last_message_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </span>
                  )}
                </small>
              </div>
              {chat.unread_count > 0 && (
                <span className="unread-count">{chat.unread_count}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeChat && (
        <ChatBox
          chatId={activeChat.chat_id}
          activeChatFriend={activeChat.other_user}
          onClose={() => setActiveChat(null)}
          updateChatList={updateChatList}
        />
      )}
    </div>
  );
}
