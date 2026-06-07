
import { io } from "socket.io-client";

let socket = null;
let tokenStored = null;


export const initSocket = (token) => {
  if (!token) {
    console.warn("⚠️ No token provided for socket init");
    return null;
  }

  if (!socket || tokenStored !== token) {


    const SOCKET_URL =
      window.location.hostname === "localhost"
        ? "http://localhost:5005"
        : window.location.origin;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    tokenStored = token;

   
    socket.on("connect", () => {});
    socket.on("connect_error", (err) => console.error("❌ Socket connect error:", err));
    socket.on("disconnect", () => {});


    window.socket = socket;
  }

  return socket;
};


export const joinChatSocket = (chatId) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (joinChatSocket)");
  if (!chatId) return console.warn("⚠️ No chatId provided for joinChatSocket");
  
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


export const markMessagesAsReadSocket = (chatId) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (markMessagesAsReadSocket)");
  if (!chatId) return console.warn("⚠️ No chatId provided for markMessagesAsReadSocket");
  
  if (socket.connected) {
    socket.emit("mark_read", { chat_id: chatId });
  } else {
    socket.once("connect", () => {
      socket.emit("mark_read", { chat_id: chatId });
    });
  }
};


export const onNewMessage = (callback) => {
  if (!socket) return;

  socket.off("new_message");
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

export const onMessageSeen = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onMessageSeen)");
  
  socket.off("message_seen");
  socket.on("message_seen", callback);
};

export const onNewNotification = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onNewNotification)");
  
  socket.off("new_notification");
  socket.on("new_notification", callback);
};

export const onNewPost = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onNewPost)");
  
  socket.off("new_post");
  socket.on("new_post", callback);
};

export const onPostUpdated = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onPostUpdated)");
  
  socket.off("post_updated");
  socket.on("post_updated", callback);
};

export const onPostDeleted = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onPostDeleted)");
  
  socket.off("post_deleted");
  socket.on("post_deleted", callback);
};

export const onPostLiked = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onPostLiked)");
  
  socket.off("post_liked");
  socket.on("post_liked", callback);
};

export const onPostCommented = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onPostCommented)");
  
  socket.off("post_commented");
  socket.on("post_commented", callback);
};

export const onFriendRequestReceived = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onFriendRequestReceived)");
  
  socket.off("friend_request_received");
  socket.on("friend_request_received", callback);
};

export const onFriendRequestAccepted = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onFriendRequestAccepted)");
  
  socket.off("friend_request_accepted");
  socket.on("friend_request_accepted", callback);
};

export const onFriendRequestCancelled = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onFriendRequestCancelled)");
  
  socket.off("friend_request_cancelled");
  socket.on("friend_request_cancelled", callback);
};

export const onUnfriended = (callback) => {
  if (!socket) return console.warn("⚠️ Socket not initialized (onUnfriended)");
  
  socket.off("unfriended");
  socket.on("unfriended", callback);
};


export const disconnectSocket = () => {
  if (!socket) return console.warn("⚠️ Socket not initialized (disconnectSocket)");
  socket.disconnect();
  socket = null;
  tokenStored = null;

};