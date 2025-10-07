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

const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, permissions } = req.body;

    // 🔹 نتحقق من وجود الرول
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        status: "error",
        message: "Role not found",
      });
    }

    // 🔹 تحديث اسم الرول لو اتغير
    if (name) {
      role["role-name"] = name;
      await role.save();
    }

    // 🔹 تحديث الصلاحيات
    if (permissions && Array.isArray(permissions)) {
      // احذف الصلاحيات القديمة
      await RolePermission.destroy({ where: { role_id: roleId } }); // ✅ نفس اسم العمود في الجدول

      // أضف الصلاحيات الجديدة
      const newPermissions = permissions.map((pid) => ({
        role_id: roleId, // ✅ استخدم نفس الاسم في الجدول
        permission_id: pid,
      }));

      await RolePermission.bulkCreate(newPermissions);
    }

    // ✅ رجّع النتيجة بعد التحديث
    return res.status(200).json({
      status: "success",
      message: "Role updated successfully",
      data: {
        id: role.id,
        name: role["role-name"],
        permissions: permissions || "unchanged",
      },
    });
  } catch (error) {
    console.error("❌ Error updating role:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  createRole,
  getAllRolesWithPermissions,
  assignRoleToStaff,
  viewEmployeesByRole,
  updateRole,
};
