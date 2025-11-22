const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification
 * @param {Object} params - Notification parameters
 * @param {number} params.receiverId - ID of the user receiving the notification
 * @param {number|null} params.senderId - ID of the user triggering the action (null for system notifications)
 * @param {string} params.type - Type of notification
 * @param {string} params.message - Human-readable message
 * @param {Object|null} params.navigation - Navigation data for frontend routing
 * @returns {Promise<Notification>} Created notification
 */
const createNotification = async ({ receiverId, senderId, type, message, navigation = null }) => {
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
      navigation,
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
    message: `${senderName} sent you a connection request`,
    navigation: {
      screen: 'friend-requests',
      action: 'view'
    }
  });
};

const notifyRequestAccepted = async (receiverId, senderId) => {
  const senderName = await getSenderName(senderId);
  return createNotification({
    receiverId,
    senderId,
    type: 'accept_request',
    message: `${senderName} accepted your connection request`,
    navigation: {
      screen: 'profile',
      userId: senderId
    }
  });
};

const notifyAddedToGroup = async (receiverId, senderId, groupName, groupId = null) => {
  const senderName = await getSenderName(senderId);
  return createNotification({
    receiverId,
    senderId,
    type: 'added_to_group',
    message: `${senderName} added you to the group "${groupName}"`,
    navigation: groupId ? {
      screen: 'group',
      groupId: groupId
    } : {
      screen: 'groups',
      action: 'view'
    }
  });
};

/**
 * Create notification for post interactions
 */
const notifyPostLiked = async (postAuthorId, likerId, postId) => {
  const likerName = await getSenderName(likerId);
  return createNotification({
    receiverId: postAuthorId,
    senderId: likerId,
    type: 'like',
    message: `${likerName} liked your post`,
    navigation: {
      screen: 'post',
      postId: postId
    }
  });
};

const notifyPostCommented = async (postAuthorId, commenterId, postId, commentId = null) => {
  const commenterName = await getSenderName(commenterId);
  return createNotification({
    receiverId: postAuthorId,
    senderId: commenterId,
    type: 'comment',
    message: `${commenterName} commented on your post`,
    navigation: {
      screen: 'post',
      postId: postId,
      commentId: commentId
    }
  });
};

const notifyCommentReplied = async (commentAuthorId, replierId, postId, commentId, replyId = null) => {
  const replierName = await getSenderName(replierId);
  return createNotification({
    receiverId: commentAuthorId,
    senderId: replierId,
    type: 'reply',
    message: `${replierName} replied to your comment`,
    navigation: {
      screen: 'post',
      postId: postId,
      commentId: commentId,
      replyId: replyId
    }
  });
};

const notifyCommentEdited = async (postAuthorId, editorId, postId, commentId = null) => {
  const editorName = await getSenderName(editorId);
  return createNotification({
    receiverId: postAuthorId,
    senderId: editorId,
    type: 'edit_comment',
    message: `${editorName} edited a comment on your post`,
    navigation: {
      screen: 'post',
      postId: postId,
      commentId: commentId
    }
  });
};

const notifyCommentDeleted = async (postAuthorId, deleterId, postId) => {
  const deleterName = await getSenderName(deleterId);
  return createNotification({
    receiverId: postAuthorId,
    senderId: deleterId,
    type: 'delete_comment',
    message: `${deleterName} deleted a comment on your post`,
    navigation: {
      screen: 'post',
      postId: postId
    }
  });
};

/**
 * Create notification for messaging
 */
const notifyMessageReceived = async (receiverId, senderId, chatId = null) => {
  const senderName = await getSenderName(senderId);
  return createNotification({
    receiverId,
    senderId,
    type: 'message',
    message: `${senderName} sent you a message`,
    navigation: {
      screen: 'chat',
      chatId: chatId,
      userId: senderId
    }
  });
};

/**
 * Create notification for system/admin actions
 */
const notifyAnnouncement = async (receiverId, announcementTitle, announcementId = null) => {
  return createNotification({
    receiverId,
    senderId: null,
    type: 'announcement',
    message: `New announcement: ${announcementTitle}`,
    navigation: announcementId ? {
      screen: 'announcement',
      announcementId: announcementId
    } : {
      screen: 'announcements',
      action: 'view'
    }
  });
};

const notifyRoleUpdate = async (receiverId, adminId) => {
  const adminName = await getSenderName(adminId);
  return createNotification({
    receiverId,
    senderId: adminId,
    type: 'role_update',
    message: `${adminName} updated your role or permissions`,
    navigation: {
      screen: 'profile',
      action: 'view'
    }
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

