// src/controllers/staff.controller.js
const Staff = require("../models/Staff");
const User = require("../models/User");
const HttpStatusHelper = require("../utils/HttpStatuHelper");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");
// get all staff
const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.findAll({
      include: {
        model: User,
        attributes: [
          "id",
          "first-name",
          "last-name",
          "national-id",
          "email",
          "phone-number",
          "birth-date",
          "user-type",
        ],
      },
    });

    return res.status(200).json({
      status: "success",
      message: "All staff fetched successfully",
      data: staff,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Error fetching staff",
      data: [],
    });
  }
};

// suspend/activate staff
const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expected: "active" or "inactive"

    // validate
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        status: HttpStatusHelper.FAIL,
        message: "Invalid status value. Must be 'active' or 'inactive'.",
        data: null,
      });
    }

    // find staff
    const staff = await Staff.findByPk(id, { include: [{ model: User }] });

    if (!staff) {
      return res.status(404).json({
        status: HttpStatusHelper.FAIL,
        message: "Staff not found",
        data: null,
      });
    }

    // update status
    staff["status-to-login"] = status;
    await staff.save();

    return res.json({
      status: HttpStatusHelper.SUCCESS,
      message: `Staff status updated to ${status} successfully`,
      data: {
        staffId: staff.staff_id,
        fullName: `${staff.User["first-name"]} ${staff.User["last-name"]}`,
        status: staff["status-to-login"],
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: HttpStatusHelper.ERROR || "error",
      message: err.message,
      data: null,
    });
  }
};
// get staff profile (staff can only access their own profile)
const getStaffProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is staff
    if (req.user["user-type"] !== "staff") {
      return res.status(403).json({
        status: "error",
        message: "Only staff members can access staff profiles",
      });
    }

    // Find staff record with user details, roles, and permissions
    const staff = await Staff.findByPk(userId, {
      include: [
        {
          model: User,
          attributes: [
            "id",
            "first-name",
            "last-name",
            "national-id",
            "email",
            "phone-number",
            "birth-date",
            "user-type",
          ],
        },
        {
          model: Role,
          through: {
            attributes: [], // Don't include StaffRole attributes
          },
          attributes: ["id", "role-name"],
          include: [
            {
              model: RolePermission,
              include: [
                {
                  model: Permission,
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!staff) {
      return res.status(404).json({
        status: "error",
        message: "Staff profile not found",
      });
    }

    // Format the response data with roles and permissions
    const profileData = {
      fullName: `${staff.User["first-name"]} ${staff.User["last-name"]}`,
      nationalId: staff.User["national-id"],
      workId: staff.staff_id, // Using staff_id as work ID
      email: staff.User.email,
      phoneNumber: staff.User["phone-number"],
      birthDate: staff.User["birth-date"],
      userType: staff.User["user-type"],
      status: staff["status-to-login"],
      roles: staff.Roles.map(role => ({
        role_id: role.id,
        name: role["role-name"],
        permissions: role.RolePermissions.map(rp => ({
          name: rp.Permission.name,
          "can-view": rp["can-view"] || false,
          "can-edit": rp["can-edit"] || false,
          "can-delete": rp["can-delete"] || false,
          "can-add": rp["can-add"] || false,
        })),
      })),
    };

    return res.status(200).json({
      status: HttpStatusHelper.SUCCESS,
      message: "Staff profile retrieved successfully",
      data: profileData,
    });
  } catch (error) {
    console.error("Error fetching staff profile:", error);
    return res.status(500).json({
      status: HttpStatusHelper.ERROR,
      message: "Failed to fetch staff profile: " + error.message,
    });
  }
};

module.exports = { getAllStaff, updateStaffStatus, getStaffProfile };

