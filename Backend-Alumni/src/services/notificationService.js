const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification
 * @param {Object} params - Notification parameters
 * @param {number} params.receiverId - ID of the user receiving the notification
 * @param {number|null} params.senderId - ID of the user triggering the action (null for system notifications)
 * @param {string} params.type - Type of notification
 * @param {string} params.message - Human-readable message
 * @returns {Promise<Notification>} Created notification
 */
const createNotification = async ({ receiverId, senderId, type, message }) => {
  try {
    // Don't create notification if receiver and sender are the same
    if (senderId && receiverId === senderId) {
      return null;
    }

    const notification = await Notification.create({
      receiverId,
      senderId: senderId || null,
      type,
      message,
      isRead: false
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw error - notifications shouldn't break main functionality
    return null;
  }
};

/**
 * Get sender's name for notification message
 * @param {number} senderId - ID of the sender
 * @returns {Promise<string>} Sender's full name
 */
const getSenderName = async (senderId) => {
  try {
    if (!senderId) return 'System';
    const sender = await User.findByPk(senderId);
    if (!sender) return 'Someone';
    return `${sender['first-name']} ${sender['last-name']}`;
  } catch (error) {
    console.error('Error getting sender name:', error);
    return 'Someone';
  }
};

/**
 * Create notification for user interactions
 */
const notifyUserAdded = async (receiverId, senderId) => {
  const senderName = await getSenderName(senderId);
  return createNotification({
    receiverId,
    senderId,
    type: 'add_user',
    message: `${senderName} sent you a connection request`
  });
};

const notifyRequestAccepted = async (receiverId, senderId) => {
  const senderName = await getSenderName(senderId);
  return createNotification({
    receiverId,
    senderId,
    type: 'accept_request',
    message: `${senderName} accepted your connection request`
  });
};

const notifyAddedToGroup = async (receiverId, senderId, groupName) => {
  const senderName = await getSenderName(senderId);
  return createNotification({
    receiverId,
    senderId,
    type: 'added_to_group',
    message: `${senderName} added you to the group "${groupName}"`
  });
};

/**
 * Create notification for post interactions
 */
const notifyPostLiked = async (postAuthorId, likerId) => {
  const likerName = await getSenderName(likerId);
  return createNotification({
    receiverId: postAuthorId,
    senderId: likerId,
    type: 'like',
    message: `${likerName} liked your post`
  });
};

const notifyPostCommented = async (postAuthorId, commenterId) => {
  const commenterName = await getSenderName(commenterId);
  return createNotification({
    receiverId: postAuthorId,
    senderId: commenterId,
    type: 'comment',
    message: `${commenterName} commented on your post`
  });
};

const notifyCommentReplied = async (commentAuthorId, replierId) => {
  const replierName = await getSenderName(replierId);
  return createNotification({
    receiverId: commentAuthorId,
    senderId: replierId,
    type: 'reply',
    message: `${replierName} replied to your comment`
  });
};

const notifyCommentEdited = async (postAuthorId, editorId) => {
  const editorName = await getSenderName(editorId);
  return createNotification({
    receiverId: postAuthorId,
    senderId: editorId,
    type: 'edit_comment',
    message: `${editorName} edited a comment on your post`
  });
};

const notifyCommentDeleted = async (postAuthorId, deleterId) => {
  const deleterName = await getSenderName(deleterId);
  return createNotification({
    receiverId: postAuthorId,
    senderId: deleterId,
    type: 'delete_comment',
    message: `${deleterName} deleted a comment on your post`
  });
};

/**
 * Create notification for messaging
 */
const notifyMessageReceived = async (receiverId, senderId) => {
  const senderName = await getSenderName(senderId);
  return createNotification({
    receiverId,
    senderId,
    type: 'message',
    message: `${senderName} sent you a message`
  });
};

/**
 * Create notification for system/admin actions
 */
const notifyAnnouncement = async (receiverId, announcementTitle) => {
  return createNotification({
    receiverId,
    senderId: null,
    type: 'announcement',
    message: `New announcement: ${announcementTitle}`
  });
};

const notifyRoleUpdate = async (receiverId, adminId) => {
  const adminName = await getSenderName(adminId);
  return createNotification({
    receiverId,
    senderId: adminId,
    type: 'role_update',
    message: `${adminName} updated your role or permissions`
  });
};

module.exports = {
  createNotification,
  getSenderName,
  notifyUserAdded,
  notifyRequestAccepted,
  notifyAddedToGroup,
  notifyPostLiked,
  notifyPostCommented,
  notifyCommentReplied,
  notifyCommentEdited,
  notifyCommentDeleted,
  notifyMessageReceived,
  notifyAnnouncement,
  notifyRoleUpdate
};

