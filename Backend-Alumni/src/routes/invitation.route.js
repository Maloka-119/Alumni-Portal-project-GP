const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitation.controller');
const { protect } = require('../middleware/authMiddleware');

// send invitation
router.post('/send', protect, invitationController.sendInvitation);

// accept invitation
router.post('/:id/accept', protect, invitationController.acceptInvitation);

// delete invitation by reciever
router.delete('/:id', protect, invitationController.deleteInvitation);

//(cancel) by sender
router.post('/:id/cancel', protect, invitationController.cancelInvitation);

//view invitation
router.get('/received', protect, invitationController.getReceivedInvitations);

module.exports = router;
