const Staff = require("../models/Staff");
const Role = require("../models/Role");
const Permission = require("../models/Permission");

const checkStaffPermission = async (
  staffId,
  requiredPermission,
  requiredAction
) => {
  try {
    console.log(
      `🔍 Checking permission: ${requiredPermission} - ${requiredAction} for staff: ${staffId}`
    );

    // 1. جيب الستاف مع الـ roles والـ permissions
    const staff = await Staff.findByPk(staffId, {
      include: [
        {
          model: Role,
          include: [
            {
              model: Permission,
              through: {
                attributes: ["can-view", "can-edit", "can-delete", "can-add"],
              },
            },
          ],
        },
      ],
    });

    if (!staff) {
      console.log("❌ Staff not found");
      return false;
    }

    console.log(`📋 Staff has ${staff.Roles ? staff.Roles.length : 0} roles`);

    // 2. دور على الصلاحية المطلوبة في كل الـ roles
    for (const role of staff.Roles) {
      console.log(`🔹 Checking role: ${role["role-name"]}`);

      for (const perm of role.Permissions) {
        console.log(
          `   Permission: ${perm.name} - view:${perm.RolePermission["can-view"]}, edit:${perm.RolePermission["can-edit"]}`
        );

        if (perm.name === requiredPermission) {
          // 3. شوف لو الـ action المطلوب متاح
          if (requiredAction === "view" && perm.RolePermission["can-view"]) {
            console.log(`✅ Permission granted: ${requiredPermission} - view`);
            return true;
          }
          if (requiredAction === "edit" && perm.RolePermission["can-edit"]) {
            console.log(`✅ Permission granted: ${requiredPermission} - edit`);
            return true;
          }
          if (
            requiredAction === "delete" &&
            perm.RolePermission["can-delete"]
          ) {
            console.log(
              `✅ Permission granted: ${requiredPermission} - delete`
            );
            return true;
          }
          if (requiredAction === "add" && perm.RolePermission["can-add"]) {
            console.log(`✅ Permission granted: ${requiredPermission} - add`);
            return true;
          }
        }
      }
    }

    console.log(
      `❌ Permission denied: ${requiredPermission} - ${requiredAction}`
    );
    return false;
  } catch (error) {
    console.error("❌ Error checking permission:", error);
    return false;
  }
};

module.exports = checkStaffPermission;
