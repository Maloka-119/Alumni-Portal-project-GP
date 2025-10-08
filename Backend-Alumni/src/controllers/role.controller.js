// src/controllers/role.controller.js
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");
const Staff = require("../models/Staff");
const StaffRole = require("../models/StaffRole");
const User = require("../models/User");

// 🟢 إنشاء رول جديدة وربطها ببعض البرميشنز
const createRole = async (req, res) => {
  try {
    const { roleName, permissions } = req.body;

    if (!roleName) {
      return res.status(400).json({
        status: "error",
        message: "Role name is required",
      });
    }

    // 1️⃣ إنشاء رول جديد
    const role = await Role.create({ "role-name": roleName });

    // 2️⃣ جلب جميع البيرميشن من الداتابيز
    const allPermissions = await Permission.findAll();

    // 3️⃣ دمج القيم المرسلة مع الافتراضية + فلترة الـ Reports
    const updatedPermissions = allPermissions.map((perm) => {
      const matched = permissions?.find((p) => p.permission_id === perm.id);

      // القيم الافتراضية
      let canView = matched ? matched["can-view"] : false;
      let canEdit = matched ? matched["can-edit"] : false;
      let canDelete = matched ? matched["can-delete"] : false;

      // 🚫 لو البيرميشن اسمه Reports → نسمح بس بالـ view
      if (perm.name === "Reports") {
        canEdit = false;
        canDelete = false;
      }

      return {
        id: perm.id,
        name: perm.name,
        "can-view": canView,
        "can-edit": canEdit,
        "can-delete": canDelete,
      };
    });

    // 4️⃣ حفظ العلاقة في RolePermission
    await Promise.all(
      updatedPermissions.map(async (perm) => {
        await RolePermission.create({
          role_id: role.id,
          permission_id: perm.id,
          "can-view": perm["can-view"],
          "can-edit": perm["can-edit"],
          "can-delete": perm["can-delete"],
        });
      })
    );

    // ✅ رجّع الريسبونس بكل التفاصيل
    return res.status(201).json({
      status: "success",
      message: "Role created successfully",
      role: {
        id: role.id,
        "role-name": role["role-name"],
        permissions: updatedPermissions,
      },
    });
  } catch (error) {
    console.error("❌ Error creating role:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create role",
      error: error.message,
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
    const { staffId, roles } = req.body;
    console.log("🟢 Incoming staffId:", staffId, "roles:", roles);

    if (!staffId || !roles || !Array.isArray(roles)) {
      console.warn("❌ staffId or roles array missing!");
      return res.status(400).json({
        status: "error",
        message: "staffId and roles array are required",
      });
    }

    // ✅ تحقق أن الـ Staff موجود
    const staff = await Staff.findByPk(staffId, {
      include: {
        model: User,
        attributes: ["first-name", "last-name", "email"],
      },
    });
    if (!staff) {
      console.warn("❌ Staff not found:", staffId);
      return res.status(404).json({
        status: "error",
        message: "Staff not found",
      });
    }
    console.log("🟢 Staff found:", staff.staff_id);

    // ✅ تحقق من وجود الـ Roles
    const validRoles = await Role.findAll({
      where: { id: roles },
      attributes: ["id", "role-name"],
    });
    console.log(
      "🟢 Valid roles fetched:",
      validRoles.map((r) => r.id)
    );
    if (validRoles.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No valid roles found",
      });
    }

    // 🟡 جلب الـ Roles الحالية للـ Staff
    const existingStaffRoles = await StaffRole.findAll({
      where: { staff_id: staffId },
    });
    console.log(
      "🟡 Existing StaffRoles:",
      existingStaffRoles.map((r) => r.role_id)
    );

    // 🔗 إنشاء روابط جديدة فقط للـ Roles الغير موجودة مسبقًا
    const rolesToAdd = validRoles.filter(
      (r) => !existingStaffRoles.some((er) => er.role_id === r.id)
    );
    console.log(
      "🔹 Roles to add:",
      rolesToAdd.map((r) => r.id)
    );

    await Promise.all(
      rolesToAdd.map((role) =>
        StaffRole.create({
          staff_id: staffId,
          role_id: role.id,
        })
      )
    );

    // ✅ جلب جميع الـ Roles النهائية للـ Staff بعد التحديث
    const updatedStaffRoles = await StaffRole.findAll({
      where: { staff_id: staffId },
      include: {
        model: Role,
        attributes: ["id", "role-name"],
      },
    });
    console.log(
      "✅ Updated StaffRoles:",
      updatedStaffRoles.map((r) => r.Role["role-name"])
    );

    return res.status(200).json({
      status: "success",
      message: "Roles assigned to staff successfully",
      staff: {
        staff_id: staff.staff_id,
        full_name: `${staff.User["first-name"]} ${staff.User["last-name"]}`,
        email: staff.User.email,
        "status-to-login": staff["status-to-login"],
        roles: updatedStaffRoles.map((r) => r.Role),
      },
    });
  } catch (error) {
    console.error("❌ Error assigning roles:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to assign roles",
      error: error.message,
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

const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params; // ✅ ناخد roleId من URL مش من body
    const { roleName, permissions } = req.body;

    if (!roleId) {
      return res.status(400).json({
        status: "error",
        message: "Role ID is required",
      });
    }

    if (!roleName) {
      return res.status(400).json({
        status: "error",
        message: "Role name is required",
      });
    }

    // ✅ تحقق إن الرول موجود
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        status: "error",
        message: "Role not found",
      });
    }

    // ✅ عدل اسم الرول
    role["role-name"] = roleName;
    await role.save();

    // ✅ احذف البيرميشن القديمة
    await RolePermission.destroy({ where: { role_id: roleId } });

    // ✅ كل البيرميشن الموجودة
    const allPermissions = await Permission.findAll();

    // ✅ جهز القيم الجديدة
    const updatedPermissions = allPermissions.map((perm) => {
      const matched = permissions?.find((p) => p.permission_id === perm.id);

      let canView = matched ? matched["can-view"] : false;
      let canEdit = matched ? matched["can-edit"] : false;
      let canDelete = matched ? matched["can-delete"] : false;

      // 🚫 Reports بس لها view فقط
      if (perm.name === "Reports") {
        canEdit = false;
        canDelete = false;
      }

      return {
        id: perm.id,
        name: perm.name,
        "can-view": canView,
        "can-edit": canEdit,
        "can-delete": canDelete,
      };
    });

    // ✅ أعد إنشاء العلاقات
    await Promise.all(
      updatedPermissions.map(async (perm) => {
        await RolePermission.create({
          role_id: roleId,
          permission_id: perm.id,
          "can-view": perm["can-view"],
          "can-edit": perm["can-edit"],
          "can-delete": perm["can-delete"],
        });
      })
    );

    // ✅ رجع الريسبونس النهائي
    return res.status(200).json({
      status: "success",
      message: "Role updated successfully",
      role: {
        id: role.id,
        "role-name": role["role-name"],
        permissions: updatedPermissions,
      },
    });
  } catch (error) {
    console.error("❌ Error updating role:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update role",
      error: error.message,
    });
  }
};
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId) {
      return res.status(400).json({
        status: "error",
        message: "Role ID is required",
      });
    }

    // ✅ تحقق أن الرول موجود
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        status: "error",
        message: "Role not found",
      });
    }

    // 🧹 احذف كل العلاقات الخاصة بالرول:
    await Promise.all([
      RolePermission.destroy({ where: { role_id: roleId } }), // يحذف صلاحيات الرول
      StaffRole.destroy({ where: { role_id: roleId } }), // يحذف الرول من كل الموظفين
    ]);

    // 🗑️ احذف الرول نفسه
    await role.destroy();

    // ✅ الريسبونس النهائي
    return res.status(200).json({
      status: "success",
      message: "Role deleted successfully and removed from all staff",
      deletedRole: {
        id: role.id,
        "role-name": role["role-name"],
      },
    });
  } catch (error) {
    console.error("❌ Error deleting role:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete role",
      error: error.message,
    });
  }
};
const deleteRoleFromStaff = async (req, res) => {
  try {
    const { staffId, roleId } = req.params;

    if (!staffId || !roleId) {
      return res.status(400).json({
        status: "error",
        message: "staffId and roleId are required",
      });
    }

    // ✅ تحقق أن الموظف موجود
    const staff = await Staff.findByPk(staffId);
    if (!staff) {
      return res.status(404).json({
        status: "error",
        message: "Staff not found",
      });
    }

    // ✅ تحقق أن الرول موجود
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        status: "error",
        message: "Role not found",
      });
    }

    // 🔍 تحقق أن العلاقة موجودة أصلًا
    const existing = await StaffRole.findOne({
      where: { staff_id: staffId, role_id: roleId },
    });

    if (!existing) {
      return res.status(404).json({
        status: "error",
        message: "This role is not assigned to this staff",
      });
    }

    // 🗑️ احذف العلاقة فقط من StaffRole
    await StaffRole.destroy({ where: { staff_id: staffId, role_id: roleId } });

    // ✅ الريسبونس النهائي
    return res.status(200).json({
      status: "success",
      message: `Role '${role["role-name"]}' removed from staff successfully`,
      removed: {
        staff_id: staff.staff_id,
        "staff-status": staff["status-to-login"],
        role: {
          id: role.id,
          "role-name": role["role-name"],
        },
      },
    });
  } catch (error) {
    console.error("❌ Error deleting role from staff:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to remove role from staff",
      error: error.message,
    });
  }
};
const getAllRoles = async (req, res) => {
  try {
    // ✅ جلب كل الرولز مع البيرميشنز المرتبطة
    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          through: {
            attributes: ["can-view", "can-edit", "can-delete"],
          },
        },
      ],
    });

    // ✅ لو مفيش أي رولز
    if (!roles || roles.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No roles found in the system",
      });
    }

    // ✅ تنسيق الريسبونس
    const formattedRoles = roles.map((role) => ({
      id: role.id,
      "role-name": role["role-name"],
      permissions: role.Permissions.map((perm) => ({
        id: perm.id,
        name: perm.name,
        "can-view": perm.RolePermission["can-view"],
        "can-edit": perm.RolePermission["can-edit"],
        "can-delete": perm.RolePermission["can-delete"],
      })),
    }));

    // ✅ الريسبونس النهائي
    return res.status(200).json({
      status: "success",
      message: "All roles fetched successfully",
      roles: formattedRoles,
    });
  } catch (error) {
    console.error("❌ Error fetching all roles:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch roles",
      error: error.message,
    });
  }
};

const getRoleDetails = async (req, res) => {
  try {
    const { roleId } = req.params;

    // ✅ جلب الرول مع كل البرميشنز المرتبطة بيها
    const role = await Role.findByPk(roleId, {
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
        {
          model: Staff,
          through: { model: StaffRole, attributes: [] }, // يجيب العلاقة بدون بيانات اضافية
          include: [
            {
              model: User,
              attributes: ["first-name", "last-name", "email"],
            },
          ],
        },
      ],
    });

    if (!role) {
      return res.status(404).json({
        status: "error",
        message: "Role not found",
      });
    }

    // 🔹 تجهيز البرميشنز
    const permissions = role.RolePermissions.map((rp) => ({
      id: rp.Permission.id,
      name: rp.Permission.name,
      "can-view": rp["can-view"],
      "can-edit": rp["can-edit"],
      "can-delete": rp["can-delete"],
    }));

    // 🔹 تجهيز الستاف
    const staff = role.Staffs.map((s) => ({
      staff_id: s.staff_id,
      full_name: `${s.User["first-name"]} ${s.User["last-name"]}`,
      email: s.User.email,
      "status-to-login": s["status-to-login"],
    }));

    return res.status(200).json({
      status: "success",
      message: `Role details fetched successfully for role: ${role["role-name"]}`,
      role: {
        id: role.id,
        "role-name": role["role-name"],
        permissions,
        staff,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching role details:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch role details",
      error: error.message,
    });
  }
};
const getStaffByRoleId = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!roleId) {
      return res.status(400).json({
        status: "error",
        message: "roleId is required",
      });
    }

    // نجيب الرول أولاً ونتأكد إنه موجود
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        status: "error",
        message: "Role not found",
      });
    }

    // نجيب كل الـ Staff المرتبطين بالرول ده
    const staffList = await Staff.findAll({
      include: [
        {
          model: Role,
          where: { id: roleId },
          attributes: ["id", "role-name"],
          through: { attributes: [] }, // عشان ما يجيبش بيانات StaffRole
        },
        {
          model: User,
          attributes: ["first-name", "last-name", "email"],
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      message: `Staff members in role: ${role["role-name"]}`,
      role: {
        id: role.id,
        "role-name": role["role-name"],
        staff: staffList.map((staff) => ({
          staff_id: staff.staff_id,
          full_name: `${staff.User["first-name"]} ${staff.User["last-name"]}`,
          email: staff.User.email,
          "status-to-login": staff["status-to-login"],
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching staff by role:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch staff by role",
      error: error.message,
    });
  }
};

const updateRoleName = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { roleName } = req.body;

    if (!roleId || !roleName) {
      return res.status(400).json({
        status: "error",
        message: "roleId and new roleName are required",
      });
    }

    // نجيب الرول للتأكد إنه موجود
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        status: "error",
        message: "Role not found",
      });
    }

    // تحديث اسم الرول فقط
    role["role-name"] = roleName;
    await role.save();

    return res.status(200).json({
      status: "success",
      message: `Role name updated successfully to: ${roleName}`,
      role: {
        id: role.id,
        "role-name": role["role-name"],
      },
    });
  } catch (error) {
    console.error("❌ Error updating role name:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update role name",
      error: error.message,
    });
  }
};

module.exports = {
  createRole,
  getAllRolesWithPermissions,
  assignRoleToStaff,
  viewEmployeesByRole,
  updateRole,
  deleteRole,
  deleteRoleFromStaff,
  getAllRoles,
  getRoleDetails,
  getStaffByRoleId,
  updateRoleName,
};
