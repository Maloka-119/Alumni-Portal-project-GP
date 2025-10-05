// src/controllers/role.controller.js
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");
const Staff = require("../models/Staff");
const StaffRole = require("../models/StaffRole");
const User = require("../models/User");

// 🟢 إنشاء رول جديدة وربطها ببعض البرميشنز
const createRoleWithPermissions = async (req, res) => {
  try {
    const user = req.user;

    // تأكيد إن اليوزر أدمن
    if (user["user-type"] !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Only admins can create roles",
        data: [],
      });
    }

    const { roleName, permissionIds } = req.body;

    if (!roleName || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        status: "fail",
        message: "roleName and permissionIds (array) are required",
        data: [],
      });
    }

    // إنشاء الرول
    const newRole = await Role.create({ "role-name": roleName });

    // البحث عن البرميشنز المطلوبة
    const permissions = await Permission.findAll({
      where: { id: permissionIds },
    });

    if (permissions.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No valid permissions found",
        data: [],
      });
    }

    // ربط الرول بالبرميشنز
    await newRole.addPermissions(permissions);

    return res.status(201).json({
      status: "success",
      message: "Role created successfully with permissions",
      data: { newRole, permissions },
    });
  } catch (err) {
    console.error("Error creating role with permissions:", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

// 🟢 عرض كل الرولز مع البرميشنز المرتبطة بيها
const getAllRolesWithPermissions = async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });

    if (!roles || roles.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No roles found",
        data: [],
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Roles retrieved successfully",
      data: roles,
    });
  } catch (err) {
    console.error("Error fetching roles:", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

const assignRoleToStaff = async (req, res) => {
  try {
    const user = req.user; // من التوكن
    const { staffId, roleId } = req.body;

    // ✅ تأكد إن الأدمن فقط هو اللي يقدر يعمل كده
    if (user["user-type"] !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: "Only admins can assign roles",
        data: [],
      });
    }

    // ✅ تأكد إن الموظف موجود
    const staff = await Staff.findByPk(staffId);
    if (!staff) {
      return res.status(404).json({
        status: "fail",
        message: "Staff member not found",
        data: [],
      });
    }

    // ✅ تأكد إن الـ role موجود
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        status: "fail",
        message: "Role not found",
        data: [],
      });
    }

    // ✅ اربط الموظف بالدور (لو مش مربوط بالفعل)
    const [staffRole, created] = await StaffRole.findOrCreate({
      where: { staff_id: staffId, role_id: roleId },
    });

    if (!created) {
      return res.status(200).json({
        status: "info",
        message: "This role is already assigned to the staff member",
        data: staffRole,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Role assigned to staff successfully",
      data: staffRole,
    });
  } catch (err) {
    console.error("Error assigning role:", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      data: [],
    });
  }
};

const viewEmployeesByRole = async (req, res) => {
  try {
    // نجيب كل الـ Roles مع الموظفين المرتبطين بيها
    const roles = await Role.findAll({
      include: [
        {
          model: Staff,
          through: { attributes: [] }, // علشان ميرجعش بيانات الجدول الوسيط
          include: [
            {
              model: User,
              attributes: [
                "id",
                "first-name",
                "last-name",
                "email",
                "phoneNumber",
                "user-type",
              ],
            },
          ],
        },
      ],
    });

    // لو مفيش roles
    if (!roles || roles.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No roles found",
      });
    }

    // ترتيب الداتا بشكل منظم
    const result = roles.map((role) => ({
      role_id: role.id,
      role_name: role["role-name"],
      employees: role.Staffs.map((staff) => ({
        staff_id: staff.staff_id,
        first_name: staff.User?.["first-name"] || "",
        last_name: staff.User?.["last-name"] || "",
        email: staff.User?.email || "",
        phoneNumber: staff.User?.phoneNumber || "",
        user_type: staff.User?.["user-type"] || "",
      })),
    }));

    res.status(200).json({
      status: "success",
      message: "Employees grouped by roles retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching employees by role:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve employees by role",
      error: error.message,
    });
  }
};

module.exports = {
  createRoleWithPermissions,
  getAllRolesWithPermissions,
  assignRoleToStaff,
  viewEmployeesByRole,
};
