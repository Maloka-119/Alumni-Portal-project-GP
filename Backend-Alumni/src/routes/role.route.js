const express = require("express");
const router = express.Router();
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("../config/cloudinary"); 
const authMiddleware = require("../middleware/authMiddleware");
const roleController = require("../controllers/role.controller");

router.post("/create", roleController.createRole);

router.get(
  "/",
  authMiddleware.protect,
  roleController.getAllRolesWithPermissions
);
router.get(
  "/get-all-roles",
  authMiddleware.protect,
  roleController.getAllRoles
);
router.post(
  "/assign-role",
  authMiddleware.protect,
  roleController.assignRoleToStaff
);

router.get("/employees-by-role", roleController.viewEmployeesByRole);

router.put(
  "/update/:roleId",
  authMiddleware.protect,
  roleController.updateRole
);

router.delete(
  "/delete/:roleId",
  authMiddleware.protect,
  roleController.deleteRole
);
router.delete(
  "/remove/:staffId/:roleId",
  authMiddleware.protect,
  roleController.deleteRoleFromStaff
);
router.get("/:roleId", roleController.getRoleDetails);

router.get("/staff-by-role/:roleId", roleController.getStaffByRoleId);

router.patch("/update-name/:roleId", roleController.updateRoleName);

router.get("/:roleId/available-staff", roleController.getAvailableStaffForRole);

module.exports = router;
