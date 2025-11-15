// ChatBox.jsx
import { useState, useEffect, useRef } from "react";
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
import { Send, Paperclip, X, Edit, Trash2, Reply, Check, FileText, File } from "lucide-react";
import "./ChatBox.css";

export default function ChatBox({
  chatId,
  activeChatFriend,
  onClose,
  updateChatList,
  fromChatList = true,
}) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef(null);

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

  // ------------------ تحديث Chat List ------------------
  const updateChatListLastMessage = (msg) => {
    const lastMsgContent = msg.message_type === "image" ? "[صورة]" :
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
  };

  const markChatAsRead = async (targetChatId) => {
    if (!targetChatId) return;
    try {
      await API.put(`/chat/${targetChatId}/read`);
    } catch (err) {
      console.warn("Mark as read failed", err);
    }
  };

  // ------------------ جلب الرسائل ------------------
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
          } else if (msg.replyTo) {
            replyMsg = msg.replyTo;
          }
          return {
            ...msg,
            file_url: msg.attachment_url || msg.file_url || null,
            file_name: msg.attachment_name || msg.file_name || null,
            edited: msg.is_edited || false,
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
  }, [chatId, token, t, userId]);

  // ------------------ WebSocket ------------------
  useEffect(() => {
    if (!chatId || !token) return;
    const socket = initSocket(token);

    joinChatSocket(chatId);
    markMessagesAsReadSocket(chatId);

    const handleNew = (msg) => {
      if (msg.chat_id !== chatId) return;
      setMessages((prev) => {
        let replyMsg = null;
        if (msg.reply_to_message_id) {
          replyMsg = prev.find((m) => m.message_id === msg.reply_to_message_id) || msg.replyTo || null;
        } else if (msg.replyTo) {
          replyMsg = msg.replyTo;
        }
        const normalizedMsg = {
          ...msg,
          file_url: msg.attachment_url || msg.file_url || null,
          file_name: msg.attachment_name || msg.file_name || null,
          localStatus: normalizeStatus(msg.status),
          edited: msg.is_edited || false,
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
          msg.message_id === updatedMsg.message_id ? { ...msg, ...updatedMsg } : msg
        )
      );
      updateChatListLastMessage(updatedMsg);
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
      updateChatList?.((prevChats) =>
        prevChats.map((chat) =>
          chat.chat_id === chatId
            ? { ...chat, unread_count: 0, last_message_actual: { ...chat.last_message_actual, localStatus: "seen" } }
            : chat
        )
      );
    };

    onNewMessage(handleNew);
    onEditedMessage(handleEdit);
    socket.on && socket.on("message_seen", handleSeen);

    return () => {
      leaveChatSocket(chatId);
      socket.off && socket.off("message_seen", handleSeen);
    };
  }, [chatId, token, userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ------------------ إرسال الملفات ------------------
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "application/pdf", "text/plain"];
    if (f.size > maxSize) return alert("حجم الملف كبير جدًا، استخدم ملف أصغر من 10MB");
    if (!allowedTypes.includes(f.type)) return alert("نوع الملف غير مدعوم");

    let type = "file";
    if (f.type.startsWith("image/")) type = "image";
    else if (f.type === "application/pdf") type = "pdf";

    const url = URL.createObjectURL(f);
    setFile(f);
    setFilePreview({ url, type, name: f.name });
  };

  // ------------------ إرسال الرسائل ------------------
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
        reply_to: data.replyTo
          ? { ...data.replyTo }
          : replyTo
          ? { message_id: replyTo.message_id, sender_id: replyTo.sender_id, content: replyTo.content }
          : null,
        localStatus: "sent",
        edited: data.is_edited || false,
        created_at: data.created_at || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMsg]);
      // Note: Socket event is emitted by the REST API, no need to call sendMessageSocket
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

  // ------------------ تعديل الرسائل ------------------
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
        edited: res.data.data.is_edited || true,
        localStatus: normalizeStatus(res.data.data.status),
        chat_id: chatId,
      };
      setMessages((prev) => prev.map((msg) => (msg.message_id === messageId ? { ...msg, ...updatedMsg } : msg)));
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
          msg.message_id === messageId ? { ...msg, content: `[${t("Message deleted")}]`, is_deleted: true } : msg
        )
      );
      await API.delete(`/chat/messages/${messageId}`);
    } catch (err) {
      console.error(t("Delete Message Error"), err);
    }
  };

  return (
    <div className="chat-overlay" dir={direction}>
      <div  className="chat-header">
        <span>{activeChatFriend?.name || activeChatFriend?.userName || "Unknown"}</span>
        <button onClick={onClose}><X size={18} /></button>
      </div>

      <div className="chat-messages">
        {messages
          .slice()
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .map((m) => {
            const msgDate = new Date(m.created_at || Date.now());
            const isToday = msgDate.toDateString() === new Date().toDateString();
            const isMine = String(m.sender_id) === String(userId);
            const timeString = toArabicNumbers(
              isToday
                ? msgDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
                : msgDate.toLocaleString(locale, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
            );
            const replyMsg = m.reply_to;

            return (
              <div key={m.message_id} className={`chat-message ${isMine ? "me" : "friend"}`}>
                {replyMsg && (
                  <div className="reply-box">
                    <strong>{String(replyMsg.sender_id) === String(userId) ? t("You") : activeChatFriend?.name}</strong>
                    <p>{replyMsg.content}</p>
                  </div>
                )}

                {editingMessageId === m.message_id && m.message_type === "text" ? (
                  <div className="edit-message-box">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEditMessage(m.message_id); }}
                      className="edit-input"
                      autoFocus
                    />
                    <button className="icon-btn save-edit" onClick={() => saveEditMessage(m.message_id)} title={t("Save")}><Check size={16} /></button>
                    <button className="icon-btn cancel-edit" onClick={cancelEdit} title={t("Cancel")}><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    {m.is_deleted ? (
                      <span className="deleted-message">[{t("Message deleted")}]</span>
                    ) : (
                      <>
                        {(m.message_type === "text") && <span>{m.content}</span>}

                        {(m.message_type === "image" && m.file_url) && (
                          <>
                            <img
                              src={m.file_url}
                              alt={m.file_name || "sent image"}
                              className="sent-image"
                              onClick={() => window.open(m.file_url, "_blank")}
                            />
                            {m.content && <p className="file-text-below">{m.content}</p>}
                          </>
                        )}

                        {(m.message_type === "pdf" && m.file_url) && (
                          <>
                            <iframe
                              src={m.file_url}
                              title={m.file_name || "PDF"}
                              style={{ width: "100%", height: "200px", border: "1px solid #ccc", marginTop: "5px" }}
                            />
                            {m.content && <p className="file-text-below">{m.content}</p>}
                          </>
                        )}

                        {(m.message_type === "file" && m.file_url) && (
                          <>
                            <button
                              className="file-download-btn"
                              onClick={() => window.open(m.file_url, "_blank")}
                            >
                              <FileText size={16} style={{ marginRight: "5px" }} />
                              {m.file_name || "Open File"}
                            </button>
                            {m.content && <p className="file-text-below">{m.content}</p>}
                          </>
                        )}

                        <span className="message-actions">
                          <button className="icon-btn" onClick={() => setReplyTo(m)} title={t("Reply")}><Reply size={16} /></button>
                          {isMine && m.message_type === "text" && (
                            <button className="icon-btn" onClick={() => startEditMessage(m)} title={t("Edit")}><Edit size={16} /></button>
                          )}
                          {isMine && (
                            <button className="icon-btn" onClick={() => deleteMessage(m.message_id)} title={t("Delete")}><Trash2 size={16} /></button>
                          )}
                        </span>
                      </>
                    )}
                  </>
                )}

                <div className="message-time">
                  {timeString}
                  {isMine && (
                    <span
                      className={`message-status ${m.localStatus === "seen" ? "seen" : m.localStatus === "delivered" ? "delivered" : "sent"}`}
                      style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold", color: "#007bff", marginLeft: "5px" }}
                    >
                      {m.localStatus === "sent"
                        ? "✓"
                        : m.localStatus === "delivered"
                        ? "✓✓"
                        : m.localStatus === "seen"
                        ?  t("Seen") 
                        : ""}
                    </span>
                  )}
                  {m.edited && <span className="edited-label"> ({t("Edited")})</span>}
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
            ) : filePreview.type === "pdf" ? (
              <iframe
                src={filePreview.url}
                title={filePreview.name}
                style={{ width: "100%", height: "150px", border: "1px solid #ccc" }}
              />
            ) : (
              <span><File size={16} style={{ marginRight: "5px" }}/> {filePreview.name}</span>
            )}
            <button onClick={() => { setFile(null); setFilePreview(null); }} className="cancel-file"><X size={14} /></button>
          </div>
        )}

        <input
          type="text"
          placeholder={t("Type a message")}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
          disabled={!!file} // لو في ملف، حقل الكتابة يتعطل
        />
        <input type="file" style={{ display: "none" }} id="fileInput" onChange={handleFileChange} />
        <label htmlFor="fileInput" className="icon-btn"><Paperclip size={18} /></label>
        <button
          onClick={sendMessage}
          className="icon-btn send-btn"
          disabled={!newMessage.trim() && !file} // زرار الإرسال يتعطل لو لا شيء
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
