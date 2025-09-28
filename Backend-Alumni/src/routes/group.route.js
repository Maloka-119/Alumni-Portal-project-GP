// routes/groupRoutes.js
const express = require("express");
const router = express.Router();
const groupController = require("../controllers/group.controller");
const authMiddleware = require("../middleware/authMiddleware"); // middleware للتحقق من التوكن

router.post("/groups", authMiddleware.protect, groupController.createGroup);
router.get("/groups", groupController.getGroups);
router.post(
  "/groups/add-user",
  authMiddleware.protect,
  groupController.addUserToGroup
);
// routes/group.route.js
router.put(
  "/groups/:groupId",
  authMiddleware.protect,
  groupController.editGroup
);
// routes/group.route.js
router.delete(
  "/groups/:groupId",
  authMiddleware.protect,
  groupController.deleteGroup
);
// routes/group.route.js
router.get(
  "/groups/:groupId/members/count",
  authMiddleware.protect,
  groupController.getGroupMembersCount
);
// join
router.post("/groups/join", authMiddleware.protect, groupController.joinGroup);

// leave
router.delete(
  "/groups/leave/:groupId",
  authMiddleware.protect,
  groupController.leaveGroup
);

//my groups
router.get(
  "/groups/my-groups",
  authMiddleware.protect,
  groupController.getMyGroups
);

router.get("/:groupId/users", groupController.getGroupUsers);

module.exports = router;
