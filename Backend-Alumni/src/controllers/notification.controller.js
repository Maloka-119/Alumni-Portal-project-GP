const Notification = require('../models/Notification');
const User = require('../models/User');
const HttpStatusHelper = require('../utils/HttpStatuHelper');
const { Op } = require('sequelize');

/**
 * Get all notifications for the current user
 * @route GET /alumni-portal/notifications
 * @access Private
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      receiverId: userId
    };

    if (unreadOnly === 'true') {
      whereClause.isRead = false;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first-name', 'last-name', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const formattedNotifications = notifications.map(notification => ({
      id: notification.notification_id,
      receiverId: notification.receiverId,
      senderId: notification.senderId,
      type: notification.type,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      sender: notification.sender ? {
        id: notification.sender.id,
        fullName: `${notification.sender['first-name']} ${notification.sender['last-name']}`,
        email: notification.sender.email
      } : null
    }));

    res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: 'Notifications fetched successfully',
      data: formattedNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalNotifications: count,
        hasMore: offset + notifications.length < count
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: 'Failed to fetch notifications: ' + error.message
    });
  }
};

/**
 * Get unread notifications count
 * @route GET /alumni-portal/notifications/unread-count
 * @access Private
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: 'Unread count fetched successfully',
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: 'Failed to fetch unread count: ' + error.message
    });
  }
};

/**
 * Mark a notification as read
 * @route PUT /alumni-portal/notifications/:notificationId/read
 * @access Private
 */
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        notification_id: notificationId,
        receiverId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: 'Notification marked as read',
      data: {
        id: notification.notification_id,
        isRead: notification.isRead
      }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: 'Failed to mark notification as read: ' + error.message
    });
  }
};

/**
 * Mark all notifications as read
 * @route PUT /alumni-portal/notifications/read-all
 * @access Private
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const [updatedCount] = await Notification.update(
      { isRead: true },
      {
        where: {
          receiverId: userId,
          isRead: false
        }
      }
    );

    res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: 'All notifications marked as read',
      data: {
        updatedCount
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: 'Failed to mark all notifications as read: ' + error.message
    });
  }
};

/**
 * Delete a notification
 * @route DELETE /alumni-portal/notifications/:notificationId
 * @access Private
 */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        notification_id: notificationId,
        receiverId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: 'Notification not found'
      });
    }

    await notification.destroy();

    res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: 'Failed to delete notification: ' + error.message
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};

