// services/socket.js
import { io } from "socket.io-client";

let socket = null;
let tokenStored = null;

// -------------------- INIT SOCKET --------------------
export const initSocket = (token) => {
  if (!token) {
    console.warn("⚠️ No token provided for socket init");
    return null;
  }

  if (!socket || tokenStored !== token) {
    socket = io("http://localhost:5005", {
      auth: { token },
      transports: ["websocket"],
    });

    tokenStored = token;

    // Debug logs
    socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
    socket.on("connect_error", (err) => console.error("❌ Socket connect error:", err));
    socket.on("disconnect", (reason) => console.log("🔌 Socket disconnected:", reason));

    // Optional: make it global for testing in console
    window.socket = socket;
  }

  return socket;
};

// -------------------- JOIN / LEAVE CHAT --------------------
export const joinChatSocket = (chatId) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (joinChatSocket)");
  if (!chatId) return console.warn("⚠️ No chatId provided for joinChatSocket");
  
  // Wait for connection if not connected yet
  if (socket.connected) {
    socket.emit("join_chat", chatId);
  } else {
    socket.once("connect", () => {
      socket.emit("join_chat", chatId);
    });
  }
};

export const leaveChatSocket = (chatId) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (leaveChatSocket)");
  if (!chatId) return console.warn("⚠️ No chatId provided for leaveChatSocket");
  socket.emit("leave_chat", chatId);
};

// -------------------- SEND MESSAGE --------------------
export const sendMessageSocket = (message) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (sendMessageSocket)");
  if (!message) return console.warn("⚠️ No message provided for sendMessageSocket");
  socket.emit("send_message", message);
};

export const sendEditedMessageSocket = (message) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (sendEditedMessageSocket)");
  if (!message) return console.warn("⚠️ No message provided for sendEditedMessageSocket");
  socket.emit("edit_message", message);
};

// -------------------- MARK AS READ --------------------
export const markMessagesAsReadSocket = (chatId) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (markMessagesAsReadSocket)");
  if (!chatId) return console.warn("⚠️ No chatId provided for markMessagesAsReadSocket");
  
  // Wait for connection if not connected yet
  if (socket.connected) {
    socket.emit("mark_read", { chat_id: chatId });
  } else {
    socket.once("connect", () => {
      socket.emit("mark_read", { chat_id: chatId });
    });
  }
};

// -------------------- LISTENERS --------------------
export const onNewMessage = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onNewMessage)");
  socket.on("new_message", callback);
};

export const onEditedMessage = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onEditedMessage)");
  socket.on("message_edited", callback);
};

export const onMessagesMarkedAsRead = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onMessagesMarkedAsRead)");
  socket.on("messages_read", callback);
};

// -------------------- DISCONNECT --------------------
export const disconnectSocket = () => {
  if (!socket) return console.warn("⚠️ Socket not initialized (disconnectSocket)");
  socket.disconnect();
  socket = null;
  tokenStored = null;
  console.log("🔌 Socket fully disconnected");
};
