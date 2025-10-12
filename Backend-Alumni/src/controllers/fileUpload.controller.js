const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { Chat, UserBlock } = require('../models');
const { Op } = require('sequelize');
const asyncHandler = require('express-async-handler');

// Configure multer for file uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chat-attachments',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit', quality: 'auto' }
    ]
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Only one file at a time
  }
});

// @desc    Upload file attachment for chat
// @route   POST /alumni-portal/chat/:chatId/upload
// @access  Private
const uploadChatFile = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const senderId = req.user.id;

  // Verify chat access
  const chat = await Chat.findOne({
    where: {
      chat_id: chatId,
      [Op.or]: [
        { user1_id: senderId },
        { user2_id: senderId }
      ]
    }
  });

  if (!chat) {
    return res.status(404).json({
      status: 'error',
      message: 'Chat not found or access denied'
    });
  }

  // Check if user is blocked
  const receiverId = chat.user1_id === senderId ? chat.user2_id : chat.user1_id;
  const isBlocked = await UserBlock.findOne({
    where: {
      blocker_id: receiverId,
      blocked_id: senderId
    }
  });

  if (isBlocked) {
    return res.status(403).json({
      status: 'error',
      message: 'Cannot send files to this user'
    });
  }

  // Handle file upload
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'File size too large. Maximum size is 10MB.'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            status: 'error',
            message: 'Too many files. Only one file allowed per upload.'
          });
        }
      }
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    try {
      // Get file information
      const fileInfo = {
        url: req.file.path,
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        publicId: req.file.filename
      };

      // Return file information
      res.status(200).json({
        status: 'success',
        message: 'File uploaded successfully',
        data: {
          attachment_url: fileInfo.url,
          attachment_name: fileInfo.name,
          attachment_size: fileInfo.size,
          attachment_mime_type: fileInfo.mimeType,
          attachment_public_id: fileInfo.publicId,
          chat_id: chatId,
          sender_id: senderId,
          receiver_id: receiverId
        }
      });

    } catch (error) {
      console.error('Error processing file upload:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process file upload'
      });
    }
  });
});

// @desc    Delete uploaded file
// @route   DELETE /alumni-portal/chat/files/:publicId
// @access  Private
const deleteChatFile = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const userId = req.user.id;

  try {
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(`chat-attachments/${publicId}`);

    res.status(200).json({
      status: 'success',
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete file'
    });
  }
});

// @desc    Get file info
// @route   GET /alumni-portal/chat/files/:publicId/info
// @access  Private
const getFileInfo = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  try {
    // Get file info from Cloudinary
    const result = await cloudinary.api.resource(`chat-attachments/${publicId}`);

    res.status(200).json({
      status: 'success',
      data: {
        public_id: result.public_id,
        url: result.secure_url,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        created_at: result.created_at
      }
    });

  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(404).json({
      status: 'error',
      message: 'File not found'
    });
  }
});

// Middleware to handle file upload errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files. Only one file allowed per upload.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }

  next(error);
};

module.exports = {
  uploadChatFile,
  deleteChatFile,
  getFileInfo,
  handleUploadError,
  upload
};
