const express = require("express");
const router = express.Router();
const friendshipController = require("../controllers/friendshipController");

// لازم يكون عندك middleware auth يضيف req.user.graduate_id
router.get("/suggestions", friendshipController.viewSuggestions);
router.post("/request/:receiverId", friendshipController.sendRequest);
router.delete("/cancel/:receiverId", friendshipController.cancelRequest);
router.get("/requests", friendshipController.viewRequests);
router.put("/confirm/:senderId", friendshipController.confirmRequest);
router.put("/hide/:senderId", friendshipController.deleteFromMyRequests);
router.get("/friends", friendshipController.viewFriends);
router.delete("/friends/:friendId", friendshipController.deleteFriend);

module.exports = router;
