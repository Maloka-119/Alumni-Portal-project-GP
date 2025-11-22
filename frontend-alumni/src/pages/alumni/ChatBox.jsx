import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import {
  initSocket,
  sendEditedMessageSocket,
  markMessagesAsReadSocket,
  joinChatSocket,
  leaveChatSocket,
  onNewMessage,
  onEditedMessage,
} from "../../services/socket";
import { Send, Paperclip, X, Edit, Trash2, Reply, Check, File } from "lucide-react";
import "./ChatBox.css";

export default function ChatBox({ chatId, activeChatFriend, onClose, updateChatList }) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id;
  const token = localStorage.getItem("token");
  const locale = i18n.language;
  const direction = locale === "ar" ? "rtl" : "ltr";

  const toArabicNumbers = (str) => {
    if (locale !== "ar") return str;
    return str.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  };

  const normalizeStatus = (status) => {
    if (!status) return "sent";
    if (status === "read") return "seen";
    if (status === "delivered") return "delivered";
    return "sent";
  };

  const updateChatListLastMessage = useCallback((msg) => {
    const lastMsgContent =
      msg.message_type === "image" ? "[صورة]" :
      msg.message_type === "pdf" ? `[ملف PDF: ${msg.file_name}]` :
      msg.message_type === "file" ? `[ملف: ${msg.file_name}]` :
      msg.content || "";
    updateChatList?.({
      chat_id: chatId,
      content: lastMsgContent,
      localStatus: msg.localStatus || "sent",
      message_type: msg.message_type || "text",
      file_name: msg.file_name || null,
    });
  }, [updateChatList, chatId]);

  const markChatAsRead = async (targetChatId) => {
    if (!targetChatId) return;
    try {
      await API.put(`/chat/${targetChatId}/read`);
    } catch (err) {
      console.warn("Mark as read failed", err);
    }
  };

  // ------------------ Fetch messages ------------------
  useEffect(() => {
    if (!chatId || !token) return;
    let mounted = true;

    const fetchMessages = async () => {
      try {
        const res = await API.get(`/chat/${chatId}/messages`);
        const allMessages = res.data?.data?.messages || [];
        const normalizedMessages = allMessages.map((msg) => {
          let replyMsg = null;
          if (msg.reply_to_message_id) {
            replyMsg = allMessages.find((m) => m.message_id === msg.reply_to_message_id) || null;
          } else if (msg.replyTo) replyMsg = msg.replyTo;

          return {
            ...msg,
            file_url: msg.attachment_url || msg.file_url || null,
            file_name: msg.attachment_name || msg.file_name || null,
            edited: msg.is_edited || false,
            is_deleted: msg.is_deleted || false,
            reply_to: replyMsg,
            localStatus: normalizeStatus(msg.status),
            created_at: msg["created-at"] || msg.created_at || msg.createdAt || new Date().toISOString(),
          };
        });

        if (!mounted) return;
        setMessages(normalizedMessages);
        setTimeout(() => scrollToBottom(), 50);

        const hasUnread = normalizedMessages.some((msg) => msg.sender_id !== userId && msg.localStatus !== "seen");
        if (hasUnread) {
          await markChatAsRead(chatId);
          markMessagesAsReadSocket(chatId);
          updateChatListLastMessage({ localStatus: "seen" });
        }
      } catch (err) {
        console.error(t("Fetch Messages Error"), err);
      }
    };

    setMessages([]);
    fetchMessages();
    return () => { mounted = false; };
  }, [chatId, token, t, userId, updateChatListLastMessage]);

  // ------------------ Socket ------------------
  useEffect(() => {
    if (!chatId || !token) return;

    if (!socketRef.current) {
      socketRef.current = initSocket(token);
    }

    joinChatSocket(chatId);
    markMessagesAsReadSocket(chatId);

    const handleNew = (msg) => {
      if (msg.chat_id !== chatId) return;

      setMessages((prev) => {
        if (prev.some((m) => m.message_id === msg.message_id)) return prev;

        let replyMsg = null;
        if (msg.reply_to_message_id) replyMsg = prev.find((m) => m.message_id === msg.reply_to_message_id) || msg.replyTo || null;
        else if (msg.replyTo) replyMsg = msg.replyTo;

        const normalizedMsg = {
          ...msg,
          file_url: msg.attachment_url || msg.file_url || null,
          file_name: msg.attachment_name || msg.file_name || null,
          localStatus: normalizeStatus(msg.status),
          edited: msg.is_edited || false,
          is_deleted: msg.is_deleted || false,
          reply_to: replyMsg,
          created_at: msg["created-at"] || msg.created_at || new Date().toISOString(),
        };
        return [...prev, normalizedMsg];
      });

      if (String(msg.sender_id) !== String(userId)) {
        (async () => {
          try {
            await markChatAsRead(chatId);
            markMessagesAsReadSocket(chatId);
            updateChatListLastMessage({ localStatus: "seen" });
          } catch (err) {
            console.warn("Socket mark read failed", err);
          }
        })();
      }
      setTimeout(() => scrollToBottom(), 50);
    };

    const handleEdit = (updatedMsg) => {
      if (updatedMsg.chat_id !== chatId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === updatedMsg.message_id
            ? { ...msg, ...updatedMsg, edited: true, is_deleted: updatedMsg.is_deleted || false }
            : msg
        )
      );
      updateChatListLastMessage({ ...updatedMsg, edited: true });
    };

    const handleSeen = (seenData) => {
      if (seenData.chat_id !== chatId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender_id === userId && msg.localStatus !== "seen"
            ? { ...msg, localStatus: "seen" }
            : msg
        )
      );
    };

    onNewMessage(handleNew);
    onEditedMessage(handleEdit);
    socketRef.current.on && socketRef.current.on("message_seen", handleSeen);

    return () => {
      leaveChatSocket(chatId);
      socketRef.current?.off && socketRef.current.off("message_seen");
    };
  }, [chatId, token, userId, updateChatListLastMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ------------------ File ------------------
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["image/png","image/jpeg","image/jpg","image/gif","application/pdf","text/plain"];
    if (f.size > maxSize) return alert("حجم الملف كبير جدًا، استخدم ملف أصغر من 10MB");
    if (!allowedTypes.includes(f.type)) return alert("نوع الملف غير مدعوم");

    let type = "file";
    if (f.type.startsWith("image/")) type = "image";
    else if (f.type === "application/pdf") type = "pdf";

    const url = URL.createObjectURL(f);
    setFile(f);
    setFilePreview({ url, type, name: f.name });
  };

  // ------------------ Send message ------------------
  const sendMessage = async () => {
    if (!newMessage.trim() && !file) return;
    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("content", newMessage || " ");
        if (replyTo) formData.append("reply_to_id", replyTo.message_id);
        res = await API.post(`/chat/${chatId}/messages/file`, formData);
      } else {
        res = await API.post(`/chat/${chatId}/messages`, { content: newMessage, reply_to_id: replyTo?.message_id || null });
      }

      const data = res.data.data;
      const isImage = data.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      const newMsg = {
        message_id: data.message_id,
        sender_id: userId,
        content: data.content || "",
        message_type: isImage ? "image" : data.file_url?.endsWith(".pdf") ? "pdf" : data.message_type || (file ? "file" : "text"),
        file_url: data.file_url || data.attachment_url || null,
        file_name: data.file_name || data.attachment_name || (file?.name || null),
        reply_to: replyTo ? { message_id: replyTo.message_id, sender_id: replyTo.sender_id, content: replyTo.content } : null,
        localStatus: "sent",
        edited: data.is_edited || false,
        is_deleted: false,
        created_at: data.created_at || new Date().toISOString(),
      };

      setMessages((prev) => {
        if (prev.some((m) => m.message_id === newMsg.message_id)) return prev;
        return [...prev, newMsg];
      });

      updateChatListLastMessage(newMsg);
      setNewMessage("");
      setFile(null);
      setFilePreview(null);
      setReplyTo(null);
      setTimeout(() => scrollToBottom(), 50);
    } catch (err) {
      console.error("Send Message Error", err);
      alert("حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى.");
    }
  };

  // ------------------ Edit / Delete ------------------
  const startEditMessage = (message) => {
    setEditingMessageId(message.message_id);
    setEditContent(message.content);
  };
  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };
  const saveEditMessage = async (messageId) => {
    try {
      const res = await API.put(`/chat/messages/${messageId}`, { content: editContent });
      const updatedMsg = {
        message_id: messageId,
        content: res.data.data.content,
        edited: true,
        localStatus: normalizeStatus(res.data.data.status),
        chat_id: chatId,
        is_deleted: false,
      };
      setMessages((prev) =>
        prev.map((msg) => (msg.message_id === messageId ? { ...msg, ...updatedMsg } : msg))
      );
      sendEditedMessageSocket(updatedMsg);
      updateChatListLastMessage(updatedMsg);
      cancelEdit();
    } catch (err) {
      console.error(t("Edit Message Error"), err);
    }
  };
  const deleteMessage = async (messageId) => {
    try {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId
            ? { ...msg, content: `[${t("Message deleted")}]`, is_deleted: true }
            : msg
        )
      );
      await API.delete(`/chat/messages/${messageId}`);
    } catch (err) {
      console.error(t("Delete Message Error"), err);
    }
  };

  // ------------------ Render ------------------
  return (
    <div className="chat-overlay" dir={direction}>
      <div className="chat-header">
        <span>{activeChatFriend?.name || activeChatFriend?.userName || "Unknown"}</span>
        <button onClick={onClose}><X size={18} /></button>
      </div>

      <div className="chat-messages">
        {messages
          .slice()
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .map((m) => {
            const isMine = String(m.sender_id) === String(userId);
            const timeString = toArabicNumbers(
              new Date(m.created_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
            );

            return (
              <div key={m.message_id} className={`chat-message ${isMine ? "me" : "friend"}`}>
                {m.reply_to && (
                  <div className="reply-box">
                    <strong>{String(m.reply_to.sender_id) === String(userId) ? t("You") : activeChatFriend?.name}</strong>
                    <p>{m.reply_to.content}</p>
                  </div>
                )}

                {editingMessageId === m.message_id ? (
                  <div className="edit-message-box">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEditMessage(m.message_id); }}
                      className="edit-input"
                      autoFocus
                    />
                    <button className="icon-btn" onClick={() => saveEditMessage(m.message_id)}><Check size={16} /></button>
                    <button className="icon-btn" onClick={cancelEdit}><X size={16} /></button>
                  </div>
                ) : (
                  <div className="message-content">
                    {m.message_type === "image" && m.file_url && (
                      <img src={m.file_url} alt={m.file_name || "image"} className="sent-image" onClick={() => window.open(m.file_url, "_blank")} />
                    )}
                    {m.message_type === "pdf" && m.file_url && (
                      <iframe src={m.file_url} title={m.file_name || "PDF"} style={{ width: "100%", height: "200px" }} />
                    )}
                    {m.message_type === "file" && m.file_url && (
                      <button onClick={() => window.open(m.file_url, "_blank")}>
                        {m.file_name || "Open File"}
                      </button>
                    )}
                    {m.content && <p className={m.is_deleted ? "deleted-text" : ""}>{m.content}</p>}

                    <div className="message-time">
                      {timeString}
                      {m.edited && !m.is_deleted && <span className="edited-label">{t("edited")}</span>}
                      {isMine && m.localStatus === "sent" && <span className="status-label">• {t("sent")}</span>}
                      {isMine && m.localStatus === "seen" && <span className="status-label seen">• {t("seen")}</span>}
                    </div>
                  </div>
                )}

                <div className="message-actions">
                  <button className="action-btn" onClick={() => setReplyTo(m)}><Reply size={16} /></button>
                  {isMine && !m.is_deleted && (
                    <>
                      <button className="action-btn" onClick={() => startEditMessage(m)}><Edit size={16} /></button>
                      <button className="action-btn delete" onClick={() => deleteMessage(m.message_id)}><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
              </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {replyTo && (
        <div className="reply-preview">
          <div>
            <strong>{String(replyTo.sender_id) === String(userId) ? t("You") : activeChatFriend?.name}</strong>
            <p>{replyTo.content}</p>
          </div>
          <X className="cancel-reply" onClick={() => setReplyTo(null)} size={16} />
        </div>
      )}

      <div className="chat-input">
        {filePreview && (
          <div className="file-preview">
            {filePreview.type === "image" ? (
              <img src={filePreview.url} alt={filePreview.name} className="preview-img" />
            ) : (
              <span><File size={16} /> {filePreview.name}</span>
            )}
            <button onClick={() => { setFile(null); setFilePreview(null); }}><X size={14} /></button>
          </div>
        )}

        <input
          type="text"
          placeholder={t("Type a message")}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
          disabled={!!file}
        />
        <input type="file" style={{ display: "none" }} id="fileInput" onChange={handleFileChange} />
        <label htmlFor="fileInput" className="icon-btn"><Paperclip size={18} /></label>
        <button onClick={sendMessage} className="icon-btn send-btn"><Send size={18} /></button>
      </div>
    </div>
  );
}
