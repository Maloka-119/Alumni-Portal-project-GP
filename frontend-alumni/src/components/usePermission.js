// usePermission.js
export const getPermission = (moduleName, userData) => {
    if (!userData) return { canView: false, canAdd: false, canEdit: false, canDelete: false };

    // Admin يقدر يعمل كل حاجة
    if (userData.userType === "admin") {
        return { canView: true, canAdd: true, canEdit: true, canDelete: true };
    }

    // Staff: نجيب الصلاحية من roles
    const perm = userData.roles
        ?.flatMap(r => r.permissions || [])
        .find(p => p.name === moduleName);

    return {
        canView: !!perm?.["can-view"],
        canAdd: !!perm?.["can-add"],
        canEdit: !!perm?.["can-edit"],
        canDelete: !!perm?.["can-delete"],
    };
};
