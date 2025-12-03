import React, { useState, useEffect } from "react";
import { Trash2, Plus, Eye, X, ChevronRight } from "lucide-react";
import API from "../../services/api";
import "./RolesManagement.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { getPermission } from '../../components/usePermission';

const RolesManagement = ({ currentUser }) => {
  const [selectedRole, setSelectedRole] = useState("");
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [rolesData, setRolesData] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [staffList, setStaffList] = useState({});
  const [allStaff, setAllStaff] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const { t } = useTranslation();
  const perm = currentUser?.userType === "admin"
  ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
  : getPermission("Roles and Permissions Management", currentUser) || { canView: false, canAdd: false, canEdit: false, canDelete: false };


  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [permsRes, rolesRes, staffRes] = await Promise.all([
        API.get("/permissions"),
        API.get("/roles/get-all-roles"),
        API.get("/staff"),
      ]);
  
      const perms = permsRes.data?.data || [];
      const rolesRaw = rolesRes.data?.roles || [];
      const staff = staffRes.data?.data || [];
  
      const roles = rolesRaw.map(r => ({
        role_id: r.id,
        role_name: r["role-name"],
        permissions: r.permissions || [],
      }));
  
      setAvailablePermissions(perms);
      setRolesData(roles);
      setAllStaff(staff);
      setSelectedRole(roles[0]?.role_name || "");
  
      // Map staff for each role
      const staffMap = {};
      roles.forEach((r) => {
        staffMap[r.role_name] = (r.employees || []).map((e) => ({
          id: e.staff_id,
          name: `${e.first_name} ${e.last_name}`,
          role: r.role_name,
        }));
      });
      setStaffList(staffMap);
  
      // Map permissions for each role
      const permsMap = {};
      roles.forEach((r) => {
        permsMap[r.role_name] = perms.map((perm) => {
          const existing = (r.permissions || []).find(
            (p) => p.id === perm.id || p.name === perm.name
          );
          return {
            module: perm.name,
            permission_id: perm.id,
            view: existing ? !!existing["can-view"] : false,
            edit: existing ? !!existing["can-edit"] : false,
            delete: existing ? !!existing["can-delete"] : false,
            add: existing ? !!existing["can-add"] : false,
          };
        });
      });
      setPermissions(permsMap);
  
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };
  

  const fetchAvailableStaff = async (roleId) => {
    try {
      const res = await API.get(`/roles/${roleId}/available-staff`);
      if (res.data.status === "success") {
        const staffData = res.data.data.map(staff => ({
          staff_id: staff.staff_id,
          name: `${staff.User['first-name']} ${staff.User['last-name']}`,
          email: staff.User.email,
          status: staff['status-to-login']
        }));
        setAvailableStaff(staffData);
      }
    } catch (err) {
      console.error("Failed to fetch available staff:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load available staff",
        toast: true,
        position: "top-end",
        timer: 1800,
        showConfirmButton: false,
      });
    }
  };

  useEffect(() => {
    if (showAddStaffModal && selectedRole) {
      const roleObj = rolesData.find(r => r.role_name === selectedRole);
      if (roleObj) {
        fetchAvailableStaff(roleObj.role_id);
      }
    }
  }, [showAddStaffModal, selectedRole, rolesData]);

  useEffect(() => {
    const fetchStaffForSelectedRole = async () => {
      if (!selectedRole) return;
      const roleObj = rolesData.find(r => r.role_name === selectedRole);
      if (!roleObj) return;
  
      try {
        const res = await API.get(`/roles/staff-by-role/${roleObj.role_id}`);
        const staffArray = res.data.role.staff || [];
        setStaffList(prev => ({
          ...prev,
          [selectedRole]: staffArray.map(s => ({
            id: s.staff_id,
            name: s.full_name,
            role: selectedRole,
          })),
        }));
      } catch (err) {
        console.error("Failed to fetch staff for role:", err);
      }
    };
  
    fetchStaffForSelectedRole();
  }, [selectedRole, rolesData]);

  const handleDeleteStaff = async (staffId) => {
    if (!selectedRole) return;
    const roleObj = rolesData.find((r) => r.role_name === selectedRole);
    if (!roleObj) return;

    if (!window.confirm("Are you sure you want to remove this staff from the role?")) return;

    try {
      const res = await API.delete(`/roles/remove/${staffId}/${roleObj.role_id}`);

      if (res.data.status === "success") {
        const staffRes = await API.get(`/roles/staff-by-role/${roleObj.role_id}`);
        const staffArray = staffRes.data.role.staff || [];

        setStaffList((prev) => ({
          ...prev,
          [selectedRole]: staffArray.map((s) => ({
            id: s.staff_id,
            name: s.full_name,
            role: selectedRole,
          })),
        }));

        Swal.fire({
          icon: "success",
          title: "Staff removed",
          text: `The staff member has been removed from the "${selectedRole}" role.`,
          showConfirmButton: false,
          timer: 1800,
          toast: true,
          position: "top-end",
          background: "#fefefe",
          color: "#333",
        });

      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Failed to remove staff from role",
          showConfirmButton: false,
          timer: 1800,
          toast: true,
          position: "top-end",
          background: "#fefefe",
          color: "#333",
        });
      }
    } catch (err) {
      console.error("Failed to remove staff from role:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error removing staff. Check console for details.",
        showConfirmButton: false,
        timer: 1800,
        toast: true,
        position: "top-end",
        background: "#fefefe",
        color: "#333",
      });
    }
  };

  const fetchRoleDetails = async (roleId, roleName) => {
    try {
      const res = await API.get(`/roles/${roleId}`);
      const role = res.data.data;
  
      setStaffList(prev => ({
        ...prev,
        [roleName]: (role.employees || []).map(e => ({
          id: e.staff_id,
          name: `${e.first_name} ${e.last_name}`,
          role: role["role-name"] || roleName,
        }))
      }));
  
      setPermissions(prev => ({
        ...prev,
        [roleName]: (role.permissions || []).map(p => ({
          module: p.name,
          permission_id: p.id,
          view: !!p["can-view"],
          edit: !!p["can-edit"],
          delete: !!p["can-delete"],
          add: !!p["can-add"]
        }))
      }));
    } catch (err) {
      console.error("Failed to fetch role details:", err);
    }
  };

  const handleDeleteRole = async (roleName) => {
    const roleObj = rolesData.find((r) => r.role_name === roleName);
    if (!roleObj) return Swal.fire({
      icon: "error",
      title: "Error",
      text: "Role not found",
      toast: true,
      position: "top-end",
      timer: 1800,
      showConfirmButton: false,
      background: "#fefefe",
      color: "#333",
    });

    const confirm = await Swal.fire({
      icon: "warning",
      title: `Delete role "${roleName}"?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      toast: false,
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await API.delete(`/roles/delete/${roleObj.role_id}`);
      if (res.data.status === "success") {
        setRolesData((prev) => prev.filter((r) => r.role_id !== roleObj.role_id));
        if (selectedRole === roleName) setSelectedRole("");
        Swal.fire({
          icon: "success",
          title: "Deleted",
          text: res.data.message,
          toast: true,
          position: "top-end",
          timer: 1800,
          showConfirmButton: false,
          background: "#fefefe",
          color: "#333",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete role",
          toast: true,
          position: "top-end",
          timer: 1800,
          showConfirmButton: false,
          background: "#fefefe",
          color: "#333",
        });
      }
    } catch (err) {
      console.error("Error deleting role:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error deleting role. Check console.",
        toast: true,
        position: "top-end",
        timer: 1800,
        showConfirmButton: false,
        background: "#fefefe",
        color: "#333",
      });
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    const roleName = e.target.role.value.trim();
    if (!roleName) return Swal.fire({
      icon: "error",
      title: "Error",
      text: "Role name cannot be empty",
      toast: true,
      position: "top-end",
      timer: 1800,
      showConfirmButton: false,
      background: "#fefefe",
      color: "#333",
    });

    const permissionsPayload = availablePermissions.map((perm) => ({
      permission_id: perm.id,
      "can-view": false,
      "can-edit": false,
      "can-delete": false,
      "can-add": false,
    }));

    try {
      const res = await API.post("/roles/create", {
        roleName,
        permissions: permissionsPayload,
      });

      if (res.data.status === "success") {
        const newRole = {
          role_id: res.data.role.id,
          role_name: roleName,
          employees: [],
          permissions: res.data.role.permissions || [],
        };
        setRolesData((prev) => [...prev, newRole]);
        setPermissions((prev) => ({
          ...prev,
          [roleName]: availablePermissions.map((p) => ({
            module: p.name,
            permission_id: p.id,
            view: false,
            edit: false,
            delete: false,
            add: false,
          })),
        }));
        setSelectedRole(roleName);
        setShowAddRoleModal(false);

        Swal.fire({
          icon: "success",
          title: "Role created",
          text: `Role "${roleName}" created successfully.`,
          showConfirmButton: false,
          timer: 1800,
          toast: true,
          position: "top-end",
          background: "#fefefe",
          color: "#333",
        });

      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Failed to create role",
          toast: true,
          position: "top-end",
          timer: 1800,
          showConfirmButton: false,
          background: "#fefefe",
          color: "#333",
        });
      }
    } catch (err) {
      console.error("Error creating role:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error creating role. Check console for details.",
        toast: true,
        position: "top-end",
        timer: 1800,
        showConfirmButton: false,
        background: "#fefefe",
        color: "#333",
      });
    }
  };

  const togglePermission = (roleName, index, type) => {
    const rolePerms = permissions[roleName] || [];
    const modulePerm = rolePerms[index];
  
    // تحديد الصلاحيات المسموح بها لكل module
    const allowed = (() => {
      switch (modulePerm.module) {
        case "Graduate management": return ["view", "edit"];
        case "Others Requests management": return ["view", "add", "delete"];
        case "Staff management": return ["view", "edit", "add"];
        case "Communities management": return ["view", "add", "edit", "delete"];
        case "Community Post's management": return ["view", "add", "edit", "delete"];
        case "Community Members management": return ["view", "add"];
        case "Portal posts management": return ["view", "add", "edit", "delete"];
        case "Graduates posts management": return ["view", "add", "edit"];
        case "Portal Reports": return ["view"];
        case "FAQ management": return ["view", "add", "edit", "delete"];
        case "Graduates Feedback": return ["view"];
        case "Roles and Permissions Management": return ["view", "add", "edit", "delete"];
        default: return ["view"];
      }
    })();
  
    if (!allowed.includes(type)) {
      Swal.fire({
        icon: "error",
        title: t("notAllowed"),   
        text: t("cannotModifyPermission", { type }), 
        toast: true,
        position: "top-end",
        timer: 1800,
        showConfirmButton: false,
        background: "#fefefe",
        color: "#333",
      });
      return;
    }
    
  
    setPermissions((prev) => {
      const updated = rolePerms.map((p, i) => {
        if (i === index) {
          const newPerm = { ...p, [type]: !p[type] };
  
          if ((type === "edit" || type === "delete" || type === "add") && newPerm[type]) {
            newPerm.view = true;
          }
  
          return newPerm;
        }
        return p;
      });
  
      return { ...prev, [roleName]: updated };
    });
  };
  

  const handleAddStaff = async (e) => {
    e.preventDefault();
    const idInput = e.target.staffId.value.trim();
    const idSelect = e.target.staffSelect.value;
    const staffId = idInput || idSelect;
    if (!staffId) return alert("Staff ID is required");
  
    try {
      const roleObj = rolesData.find((r) => r.role_name === selectedRole);
      if (!roleObj) return alert("Role not found");
  
      const res = await API.post("/roles/assign-role", {
        staffId: Number(staffId),
        roles: [roleObj.role_id],
      });
  
      if (res.data.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Staff assigned",
          text: `The staff member has been assigned to the "${selectedRole}" role.`,
          showConfirmButton: false,
          timer: 1800,
          toast: true,
          position: "top-end",
          background: "#fefefe",
          color: "#333",
        });
        
        fetchAvailableStaff(roleObj.role_id);
        
        const staffRes = await API.get(`/roles/staff-by-role/${roleObj.role_id}`);
        const staffArray = staffRes.data.role.staff || [];

        setStaffList((prev) => ({
          ...prev,
          [selectedRole]: staffArray.map((s) => ({
            id: s.staff_id,
            name: s.full_name,
            role: selectedRole,
          })),
        }));

        setShowAddStaffModal(false);
      }
    } catch (err) {
      console.error("Failed to assign role:", err);
      alert("Failed to assign role. Check console for details.");
    }
  };

  const handleUpdateRole = async () => {
    const roleObj = rolesData.find((r) => r.role_name === selectedRole);
    if (!roleObj) return Swal.fire({
      icon: "error",
      title: "Error",
      text: "Role not found",
      toast: true,
      position: "top-end",
      timer: 1800,
      showConfirmButton: false,
      background: "#fefefe",
      color: "#333",
    });

    const rolePerms = permissions[selectedRole] || [];
    const updatedPermissions = rolePerms.map((p) => ({
      permission_id: p.permission_id,
      "can-view": p.view,
      "can-edit": p.edit,
      "can-delete": p.delete,
      "can-add": p.add,
    }));

    try {
      const res = await API.put(`/roles/update/${roleObj.role_id}`, {
        roleName: selectedRole,
        permissions: updatedPermissions,
      });

      if (res.data.status === "success") {
        setPermissions((prev) => ({ ...prev, [selectedRole]: rolePerms }));
        const updatedRoles = rolesData.map((r) =>
          r.role_id === roleObj.role_id
            ? { ...r, permissions: updatedPermissions }
            : r
        );
        setRolesData(updatedRoles);

        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Role permissions updated successfully.",
          toast: true,
          position: "top-end",
          timer: 1800,
          showConfirmButton: false,
          background: "#fefefe",
          color: "#333",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Failed to update role",
          toast: true,
          position: "top-end",
          timer: 1800,
          showConfirmButton: false,
          background: "#fefefe",
          color: "#333",
        });
      }
    } catch (err) {
      console.error("Error updating role:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error updating role. Check console for details.",
        toast: true,
        position: "top-end",
        timer: 1800,
        showConfirmButton: false,
        background: "#fefefe",
        color: "#333",
      });
    }
  };

  const currentPermissionsForSelected = () => {
    if (selectedRole && permissions[selectedRole]) return permissions[selectedRole];
    return availablePermissions.map((p) => ({
      module: p.name,
      permission_id: p.id,
      view: false,
      edit: false,
      delete: false,
      add: false
    }));
  };
  if (!perm.canView) return <p>{t("noPermission")}</p>;
  return (
    <div className="roles-container">
      <div className="roles-sidebar">
        <h3 className="roletitle">{t("rolesManagement")}</h3>
        <ul>
          {rolesData.map((role) => (
            <li
              key={role.role_id}
              className={selectedRole === role.role_name ? "active" : ""}
              onClick={() => setSelectedRole(role.role_name)}
            >
              <span>{role.role_name}</span>
              {perm.canDelete && (
  <Trash2
    size={14}
    className="delete-icon"
    style={{color:"#7e1414"}}
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteRole(role.role_name);
    }}
  />
)}

              {selectedRole === role.role_name && (
                <ChevronRight size={16} className="active-arrow" />
              )}
            </li>
          ))}
        </ul>
        {perm.canAdd && (
  <button className="add-role-btn" onClick={() => setShowAddRoleModal(true)}>
    <Plus size={16} /> {t("CreateNewRole")}
  </button>
)}
      </div>

      <div className="permissions-section">
        <div className="permissions-header">
          <h3 className="page-title">{selectedRole} {t("Permissions")}</h3>
          <button className="view-staff-btn" onClick={() => setShowStaffModal(true)}>
            <Eye size={16} /> {t("viewStaff")}
          </button>
        </div>

        <table className="permissions-table">
          <thead>
            <tr>
              <th>{t("module")}</th>
              <th>{t("delete")}</th>
              <th>{t("edit")}</th>
              <th>{t("view")}</th>
              <th>{t("add")}</th>
            </tr>
          </thead>
          <tbody>
            {currentPermissionsForSelected().map((p, i) => (
              <tr key={p.permission_id || `${selectedRole}-${i}`}>
                <td>{p.module}</td>
                <td>
                <input
  type="checkbox"
  checked={!!p.delete}
  onChange={() => togglePermission(selectedRole, i, "delete")}
  disabled={!perm.canEdit}
/>

                </td>
                <td>
                <input
  type="checkbox"
  checked={!!p.edit}
  onChange={() => togglePermission(selectedRole, i, "edit")}
  disabled={!perm.canEdit}
/>

                </td>
                <td>
                <input
  type="checkbox"
  checked={!!p.view}
  onChange={() => togglePermission(selectedRole, i, "view")}
  disabled={!perm.canEdit}
/>


                </td>
                <td>
                <input
  type="checkbox"
  checked={!!p.add}
  onChange={() => togglePermission(selectedRole, i, "add")}
  disabled={!perm.canEdit}
/>

                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="update-btn-container">
        {perm.canEdit && (
  <button onClick={handleUpdateRole} className="update-role-btn">
    {t("updatePermissions")}
  </button>
)}

        </div>
      </div>

      {showStaffModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="stitle">{selectedRole} Staff</h3>
              <button className="close-btn" onClick={() => setShowStaffModal(false)}>
                <X size={18} />
              </button>
            </div>
            <table className="staff-table">
              <thead>
                <tr>
                  <th>{t("id")}</th>
                  <th>{t("name")}</th>
                  <th>{t("role")}</th>
                  <th>{t("action")}</th>
                </tr>
              </thead>
              <tbody>
                {(staffList[selectedRole] || []).map((staff) => (
                  <tr key={staff.id}>
                    <td>{staff.id}</td>
                    <td>{staff.name}</td>
                    <td>{staff.role}</td>
                    <td>
                    {perm.canDelete && (
  <button
    className="delete-btn"
    onClick={() => handleDeleteStaff(staff.id)}
  >
    <Trash2 size={16} />
  </button>
)}

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {perm.canAdd && (
  <button className="add-staff-btn" onClick={() => setShowAddStaffModal(true)}>
    <Plus size={16} /> {t("addNewStaff")}
  </button>
)}

          </div>
        </div>
      )}

      {showAddStaffModal && (
        <div className="modal-overlay">
          <div className="modal-box small">
            <div className="modal-header">
              <h3>{t("addNewStaff")}</h3>
              <button className="close-btn" onClick={() => setShowAddStaffModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="modal-form">
              <label> {t("enterStaffId")}</label>
              <input type="text" name="staffId" placeholder="e.g. 13" />
              <h4>{t("or")}</h4>
              <label>{t("selectExistingStaff")}</label>
              <select name="staffSelect" defaultValue="">
                <option value="">{t("chooseStaff")}...</option>
                {availableStaff.map((staff) => (
                  <option key={staff.staff_id} value={staff.staff_id}>
                    {staff.staff_id} - {staff.name}
                  </option>
                ))}
              </select>
              {perm.canAdd && (
  <button type="submit" className="save-btn">
    {t("addToRole")}
  </button>
)}

            </form>
          </div>
        </div>
      )}

      {showAddRoleModal && (
        <div className="modal-overlay">
          <div className="modal-box small">
            <div className="modal-header">
              <h3 style={{ color: "darkgray" }}>{t("CreateNewRole")}</h3>
              <button className="close-btn" onClick={() => setShowAddRoleModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddRole} className="modal-form">
              <input type="text" name="role" placeholder={t("enterRoleName")} required />
              {perm.canAdd && (
  <button type="submit" className="save-btn">
    {t("create")}
  </button>
)}

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesManagement;

// import React, { useState, useEffect } from "react";
// import { Trash2, Plus, Eye, X, ChevronRight } from "lucide-react";
// import API from "../../services/api";
// import "./RolesManagement.css";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";

// const RolesManagement = () => {
//   const [selectedRole, setSelectedRole] = useState("");
//   const [showStaffModal, setShowStaffModal] = useState(false);
//   const [showAddStaffModal, setShowAddStaffModal] = useState(false);
//   const [showAddRoleModal, setShowAddRoleModal] = useState(false);
//   const [rolesData, setRolesData] = useState([]);
//   const [permissions, setPermissions] = useState({});
//   const [staffList, setStaffList] = useState({});
//   const [allStaff, setAllStaff] = useState([]);
//   const [availableStaff, setAvailableStaff] = useState([]);
//   const [availablePermissions, setAvailablePermissions] = useState([]);
//   const { t } = useTranslation();

//   useEffect(() => {
//     fetchAllData();
//   }, []);

//   const fetchAllData = async () => {
//     try {
//       const [permsRes, rolesRes, staffRes] = await Promise.all([
//         API.get("/permissions"),
//         API.get("/roles/get-all-roles"),
//         API.get("/staff"),
//       ]);
  
//       const perms = permsRes.data?.data || [];
//       const rolesRaw = rolesRes.data?.roles || [];
//       const staff = staffRes.data?.data || [];
  
//       const roles = rolesRaw.map(r => ({
//         role_id: r.id,
//         role_name: r["role-name"],
//         permissions: r.permissions || [],
//       }));
  
//       setAvailablePermissions(perms);
//       setRolesData(roles);
//       setAllStaff(staff);
//       setSelectedRole(roles[0]?.role_name || "");
  
//       // Map staff for each role
//       const staffMap = {};
//       roles.forEach((r) => {
//         staffMap[r.role_name] = (r.employees || []).map((e) => ({
//           id: e.staff_id,
//           name: `${e.first_name} ${e.last_name}`,
//           role: r.role_name,
//         }));
//       });
//       setStaffList(staffMap);
  
//       // Map permissions for each role
//       const permsMap = {};
//       roles.forEach((r) => {
//         permsMap[r.role_name] = perms.map((perm) => {
//           const existing = (r.permissions || []).find(
//             (p) => p.id === perm.id || p.name === perm.name
//           );
//           return {
//             module: perm.name,
//             permission_id: perm.id,
//             view: existing ? !!existing["can-view"] : false,
//             edit: existing ? !!existing["can-edit"] : false,
//             delete: existing ? !!existing["can-delete"] : false,
//             add: existing ? !!existing["can-add"] : false,
//           };
//         });
//       });
//       setPermissions(permsMap);
  
//     } catch (err) {
//       console.error("Failed to fetch data:", err);
//     }
//   };

//   const fetchAvailableStaff = async (roleId) => {
//     try {
//       const res = await API.get(`/roles/${roleId}/available-staff`);
//       if (res.data.status === "success") {
//         const staffData = res.data.data.map(staff => ({
//           staff_id: staff.staff_id,
//           name: `${staff.User['first-name']} ${staff.User['last-name']}`,
//           email: staff.User.email,
//           status: staff['status-to-login']
//         }));
//         setAvailableStaff(staffData);
//       }
//     } catch (err) {
//       console.error("Failed to fetch available staff:", err);
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: "Failed to load available staff",
//         toast: true,
//         position: "top-end",
//         timer: 1800,
//         showConfirmButton: false,
//       });
//     }
//   };

//   useEffect(() => {
//     if (showAddStaffModal && selectedRole) {
//       const roleObj = rolesData.find(r => r.role_name === selectedRole);
//       if (roleObj) {
//         fetchAvailableStaff(roleObj.role_id);
//       }
//     }
//   }, [showAddStaffModal, selectedRole, rolesData]);

//   useEffect(() => {
//     const fetchStaffForSelectedRole = async () => {
//       if (!selectedRole) return;
//       const roleObj = rolesData.find(r => r.role_name === selectedRole);
//       if (!roleObj) return;
  
//       try {
//         const res = await API.get(`/roles/staff-by-role/${roleObj.role_id}`);
//         const staffArray = res.data.role.staff || [];
//         setStaffList(prev => ({
//           ...prev,
//           [selectedRole]: staffArray.map(s => ({
//             id: s.staff_id,
//             name: s.full_name,
//             role: selectedRole,
//           })),
//         }));
//       } catch (err) {
//         console.error("Failed to fetch staff for role:", err);
//       }
//     };
  
//     fetchStaffForSelectedRole();
//   }, [selectedRole, rolesData]);

//   const handleDeleteStaff = async (staffId) => {
//     if (!selectedRole) return;
//     const roleObj = rolesData.find((r) => r.role_name === selectedRole);
//     if (!roleObj) return;

//     if (!window.confirm("Are you sure you want to remove this staff from the role?")) return;

//     try {
//       const res = await API.delete(`/roles/remove/${staffId}/${roleObj.role_id}`);

//       if (res.data.status === "success") {
//         const staffRes = await API.get(`/roles/staff-by-role/${roleObj.role_id}`);
//         const staffArray = staffRes.data.role.staff || [];

//         setStaffList((prev) => ({
//           ...prev,
//           [selectedRole]: staffArray.map((s) => ({
//             id: s.staff_id,
//             name: s.full_name,
//             role: selectedRole,
//           })),
//         }));

//         Swal.fire({
//           icon: "success",
//           title: "Staff removed",
//           text: `The staff member has been removed from the "${selectedRole}" role.`,
//           showConfirmButton: false,
//           timer: 1800,
//           toast: true,
//           position: "top-end",
//           background: "#fefefe",
//           color: "#333",
//         });

//       } else {
//         Swal.fire({
//           icon: "error",
//           title: "Failed",
//           text: "Failed to remove staff from role",
//           showConfirmButton: false,
//           timer: 1800,
//           toast: true,
//           position: "top-end",
//           background: "#fefefe",
//           color: "#333",
//         });
//       }
//     } catch (err) {
//       console.error("Failed to remove staff from role:", err);
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: "Error removing staff. Check console for details.",
//         showConfirmButton: false,
//         timer: 1800,
//         toast: true,
//         position: "top-end",
//         background: "#fefefe",
//         color: "#333",
//       });
//     }
//   };

//   const fetchRoleDetails = async (roleId, roleName) => {
//     try {
//       const res = await API.get(`/roles/${roleId}`);
//       const role = res.data.data;
  
//       setStaffList(prev => ({
//         ...prev,
//         [roleName]: (role.employees || []).map(e => ({
//           id: e.staff_id,
//           name: `${e.first_name} ${e.last_name}`,
//           role: role["role-name"] || roleName,
//         }))
//       }));
  
//       setPermissions(prev => ({
//         ...prev,
//         [roleName]: (role.permissions || []).map(p => ({
//           module: p.name,
//           permission_id: p.id,
//           view: !!p["can-view"],
//           edit: !!p["can-edit"],
//           delete: !!p["can-delete"],
//           add: !!p["can-add"]
//         }))
//       }));
//     } catch (err) {
//       console.error("Failed to fetch role details:", err);
//     }
//   };

//   const handleDeleteRole = async (roleName) => {
//     const roleObj = rolesData.find((r) => r.role_name === roleName);
//     if (!roleObj) return Swal.fire({
//       icon: "error",
//       title: "Error",
//       text: "Role not found",
//       toast: true,
//       position: "top-end",
//       timer: 1800,
//       showConfirmButton: false,
//       background: "#fefefe",
//       color: "#333",
//     });

//     const confirm = await Swal.fire({
//       icon: "warning",
//       title: `Delete role "${roleName}"?`,
//       showCancelButton: true,
//       confirmButtonText: "Yes",
//       cancelButtonText: "No",
//       toast: false,
//     });

//     if (!confirm.isConfirmed) return;

//     try {
//       const res = await API.delete(`/roles/delete/${roleObj.role_id}`);
//       if (res.data.status === "success") {
//         setRolesData((prev) => prev.filter((r) => r.role_id !== roleObj.role_id));
//         if (selectedRole === roleName) setSelectedRole("");
//         Swal.fire({
//           icon: "success",
//           title: "Deleted",
//           text: res.data.message,
//           toast: true,
//           position: "top-end",
//           timer: 1800,
//           showConfirmButton: false,
//           background: "#fefefe",
//           color: "#333",
//         });
//       } else {
//         Swal.fire({
//           icon: "error",
//           title: "Error",
//           text: "Failed to delete role",
//           toast: true,
//           position: "top-end",
//           timer: 1800,
//           showConfirmButton: false,
//           background: "#fefefe",
//           color: "#333",
//         });
//       }
//     } catch (err) {
//       console.error("Error deleting role:", err);
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: "Error deleting role. Check console.",
//         toast: true,
//         position: "top-end",
//         timer: 1800,
//         showConfirmButton: false,
//         background: "#fefefe",
//         color: "#333",
//       });
//     }
//   };

//   const handleAddRole = async (e) => {
//     e.preventDefault();
//     const roleName = e.target.role.value.trim();
//     if (!roleName) return Swal.fire({
//       icon: "error",
//       title: "Error",
//       text: "Role name cannot be empty",
//       toast: true,
//       position: "top-end",
//       timer: 1800,
//       showConfirmButton: false,
//       background: "#fefefe",
//       color: "#333",
//     });

//     const permissionsPayload = availablePermissions.map((perm) => ({
//       permission_id: perm.id,
//       "can-view": false,
//       "can-edit": false,
//       "can-delete": false,
//       "can-add": false,
//     }));

//     try {
//       const res = await API.post("/roles/create", {
//         roleName,
//         permissions: permissionsPayload,
//       });

//       if (res.data.status === "success") {
//         const newRole = {
//           role_id: res.data.role.id,
//           role_name: roleName,
//           employees: [],
//           permissions: res.data.role.permissions || [],
//         };
//         setRolesData((prev) => [...prev, newRole]);
//         setPermissions((prev) => ({
//           ...prev,
//           [roleName]: availablePermissions.map((p) => ({
//             module: p.name,
//             permission_id: p.id,
//             view: false,
//             edit: false,
//             delete: false,
//             add: false,
//           })),
//         }));
//         setSelectedRole(roleName);
//         setShowAddRoleModal(false);

//         Swal.fire({
//           icon: "success",
//           title: "Role created",
//           text: `Role "${roleName}" created successfully.`,
//           showConfirmButton: false,
//           timer: 1800,
//           toast: true,
//           position: "top-end",
//           background: "#fefefe",
//           color: "#333",
//         });

//       } else {
//         Swal.fire({
//           icon: "error",
//           title: "Failed",
//           text: "Failed to create role",
//           toast: true,
//           position: "top-end",
//           timer: 1800,
//           showConfirmButton: false,
//           background: "#fefefe",
//           color: "#333",
//         });
//       }
//     } catch (err) {
//       console.error("Error creating role:", err);
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: "Error creating role. Check console for details.",
//         toast: true,
//         position: "top-end",
//         timer: 1800,
//         showConfirmButton: false,
//         background: "#fefefe",
//         color: "#333",
//       });
//     }
//   };

//   const togglePermission = (roleName, index, type) => {
//     const rolePerms = permissions[roleName] || [];
//     const modulePerm = rolePerms[index];
  
//     // تحديد الصلاحيات المسموح بها لكل module
//     const allowed = (() => {
//       switch (modulePerm.module) {
//         case "Graduate management": return ["view", "edit"];
//         case "Others Requests management": return ["view", "add", "delete"];
//         case "Staff management": return ["view", "edit", "add"];
//         case "Communities management": return ["view", "add", "edit", "delete"];
//         case "Community Post's management": return ["view", "add", "edit", "delete"];
//         case "Community Members management": return ["view", "add"];
//         case "Portal posts management": return ["view", "add", "edit", "delete"];
//         case "Graduates posts management": return ["view", "add", "edit"];
//         case "Portal Reports": return ["view"];
//         case "FAQ management": return ["view", "add", "edit", "delete"];
//         case "Graduates Feedback": return ["view"];
//         default: return ["view"];
//       }
//     })();
  
//     if (!allowed.includes(type)) {
//       Swal.fire({
//         icon: "error",
//         title: t("notAllowed"),   
//         text: t("cannotModifyPermission", { type }), 
//         toast: true,
//         position: "top-end",
//         timer: 1800,
//         showConfirmButton: false,
//         background: "#fefefe",
//         color: "#333",
//       });
//       return;
//     }
    
  
//     setPermissions((prev) => {
//       const updated = rolePerms.map((p, i) => {
//         if (i === index) {
//           const newPerm = { ...p, [type]: !p[type] };
  
//           if ((type === "edit" || type === "delete" || type === "add") && newPerm[type]) {
//             newPerm.view = true;
//           }
  
//           return newPerm;
//         }
//         return p;
//       });
  
//       return { ...prev, [roleName]: updated };
//     });
//   };
  

//   const handleAddStaff = async (e) => {
//     e.preventDefault();
//     const idInput = e.target.staffId.value.trim();
//     const idSelect = e.target.staffSelect.value;
//     const staffId = idInput || idSelect;
//     if (!staffId) return alert("Staff ID is required");
  
//     try {
//       const roleObj = rolesData.find((r) => r.role_name === selectedRole);
//       if (!roleObj) return alert("Role not found");
  
//       const res = await API.post("/roles/assign-role", {
//         staffId: Number(staffId),
//         roles: [roleObj.role_id],
//       });
  
//       if (res.data.status === "success") {
//         Swal.fire({
//           icon: "success",
//           title: "Staff assigned",
//           text: `The staff member has been assigned to the "${selectedRole}" role.`,
//           showConfirmButton: false,
//           timer: 1800,
//           toast: true,
//           position: "top-end",
//           background: "#fefefe",
//           color: "#333",
//         });
        
//         fetchAvailableStaff(roleObj.role_id);
        
//         const staffRes = await API.get(`/roles/staff-by-role/${roleObj.role_id}`);
//         const staffArray = staffRes.data.role.staff || [];

//         setStaffList((prev) => ({
//           ...prev,
//           [selectedRole]: staffArray.map((s) => ({
//             id: s.staff_id,
//             name: s.full_name,
//             role: selectedRole,
//           })),
//         }));

//         setShowAddStaffModal(false);
//       }
//     } catch (err) {
//       console.error("Failed to assign role:", err);
//       alert("Failed to assign role. Check console for details.");
//     }
//   };

//   const handleUpdateRole = async () => {
//     const roleObj = rolesData.find((r) => r.role_name === selectedRole);
//     if (!roleObj) return Swal.fire({
//       icon: "error",
//       title: "Error",
//       text: "Role not found",
//       toast: true,
//       position: "top-end",
//       timer: 1800,
//       showConfirmButton: false,
//       background: "#fefefe",
//       color: "#333",
//     });

//     const rolePerms = permissions[selectedRole] || [];
//     const updatedPermissions = rolePerms.map((p) => ({
//       permission_id: p.permission_id,
//       "can-view": p.view,
//       "can-edit": p.edit,
//       "can-delete": p.delete,
//       "can-add": p.add,
//     }));

//     try {
//       const res = await API.put(`/roles/update/${roleObj.role_id}`, {
//         roleName: selectedRole,
//         permissions: updatedPermissions,
//       });

//       if (res.data.status === "success") {
//         setPermissions((prev) => ({ ...prev, [selectedRole]: rolePerms }));
//         const updatedRoles = rolesData.map((r) =>
//           r.role_id === roleObj.role_id
//             ? { ...r, permissions: updatedPermissions }
//             : r
//         );
//         setRolesData(updatedRoles);

//         Swal.fire({
//           icon: "success",
//           title: "Updated",
//           text: "Role permissions updated successfully.",
//           toast: true,
//           position: "top-end",
//           timer: 1800,
//           showConfirmButton: false,
//           background: "#fefefe",
//           color: "#333",
//         });
//       } else {
//         Swal.fire({
//           icon: "error",
//           title: "Failed",
//           text: "Failed to update role",
//           toast: true,
//           position: "top-end",
//           timer: 1800,
//           showConfirmButton: false,
//           background: "#fefefe",
//           color: "#333",
//         });
//       }
//     } catch (err) {
//       console.error("Error updating role:", err);
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: "Error updating role. Check console for details.",
//         toast: true,
//         position: "top-end",
//         timer: 1800,
//         showConfirmButton: false,
//         background: "#fefefe",
//         color: "#333",
//       });
//     }
//   };

//   const currentPermissionsForSelected = () => {
//     if (selectedRole && permissions[selectedRole]) return permissions[selectedRole];
//     return availablePermissions.map((p) => ({
//       module: p.name,
//       permission_id: p.id,
//       view: false,
//       edit: false,
//       delete: false,
//       add: false
//     }));
//   };

//   return (
//     <div className="roles-container">
//       <div className="roles-sidebar">
//         <h3 className="roletitle">{t("rolesManagement")}</h3>
//         <ul>
//           {rolesData.map((role) => (
//             <li
//               key={role.role_id}
//               className={selectedRole === role.role_name ? "active" : ""}
//               onClick={() => setSelectedRole(role.role_name)}
//             >
//               <span>{role.role_name}</span>
//               <Trash2
//                 size={14}
//                 className="delete-icon"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   handleDeleteRole(role.role_name);
//                 }}
//               />
//               {selectedRole === role.role_name && (
//                 <ChevronRight size={16} className="active-arrow" />
//               )}
//             </li>
//           ))}
//         </ul>
//         <button className="add-role-btn" onClick={() => setShowAddRoleModal(true)}>
//           <Plus size={16} />{t("CreateNewRole")}
//         </button>
//       </div>

//       <div className="permissions-section">
//         <div className="permissions-header">
//           <h3 className="page-title">{selectedRole}{t("Permissions")}</h3>
//           <button className="view-staff-btn" onClick={() => setShowStaffModal(true)}>
//             <Eye size={16} /> {t("viewStaff")}
//           </button>
//         </div>

//         <table className="permissions-table">
//           <thead>
//             <tr>
//               <th>{t("module")}</th>
//               <th>{t("delete")}</th>
//               <th>{t("edit")}</th>
//               <th>{t("view")}</th>
//               <th>{t("add")}</th>
//             </tr>
//           </thead>
//           <tbody>
//             {currentPermissionsForSelected().map((p, i) => (
//               <tr key={p.permission_id || `${selectedRole}-${i}`}>
//                 <td>{p.module}</td>
//                 <td>
//                   <input
//                     type="checkbox"
//                     checked={!!p.delete}
//                     onChange={() => togglePermission(selectedRole, i, "delete")}
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="checkbox"
//                     checked={!!p.edit}
//                     onChange={() => togglePermission(selectedRole, i, "edit")}
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="checkbox"
//                     checked={!!p.view}
//                     onChange={() => togglePermission(selectedRole, i, "view")}
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="checkbox"
//                     checked={!!p.add}
//                     onChange={() => togglePermission(selectedRole, i, "add")}
//                   />
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         <div className="update-btn-container">
//           <button onClick={handleUpdateRole} className="update-role-btn">
//             {t("updatePermissions")}
//           </button>
//         </div>
//       </div>

//       {showStaffModal && (
//         <div className="modal-overlay">
//           <div className="modal-box">
//             <div className="modal-header">
//               <h3 className="stitle">{selectedRole} Staff</h3>
//               <button className="close-btn" onClick={() => setShowStaffModal(false)}>
//                 <X size={18} />
//               </button>
//             </div>
//             <table className="staff-table">
//               <thead>
//                 <tr>
//                   <th>{t("id")}</th>
//                   <th>{t("name")}</th>
//                   <th>{t("role")}</th>
//                   <th>{t("action")}</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {(staffList[selectedRole] || []).map((staff) => (
//                   <tr key={staff.id}>
//                     <td>{staff.id}</td>
//                     <td>{staff.name}</td>
//                     <td>{staff.role}</td>
//                     <td>
//                       <button
//                         className="delete-btn"
//                         onClick={() => handleDeleteStaff(staff.id)}
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             <button className="add-staff-btn" onClick={() => setShowAddStaffModal(true)}>
//               <Plus size={16} /> {t("addNewStaff")}
//             </button>
//           </div>
//         </div>
//       )}

//       {showAddStaffModal && (
//         <div className="modal-overlay">
//           <div className="modal-box small">
//             <div className="modal-header">
//               <h3>{t("addNewStaff")}</h3>
//               <button className="close-btn" onClick={() => setShowAddStaffModal(false)}>
//                 <X size={18} />
//               </button>
//             </div>
//             <form onSubmit={handleAddStaff} className="modal-form">
//               <label> {t("enterStaffId")}</label>
//               <input type="text" name="staffId" placeholder="e.g. 13" />
//               <h4>{t("or")}</h4>
//               <label>{t("selectExistingStaff")}</label>
//               <select name="staffSelect" defaultValue="">
//                 <option value="">{t("chooseStaff")}...</option>
//                 {availableStaff.map((staff) => (
//                   <option key={staff.staff_id} value={staff.staff_id}>
//                     {staff.staff_id} - {staff.name}
//                   </option>
//                 ))}
//               </select>
//               <button type="submit" className="save-btn">
//                 {t("addToRole")}
//               </button>
//             </form>
//           </div>
//         </div>
//       )}

//       {showAddRoleModal && (
//         <div className="modal-overlay">
//           <div className="modal-box small">
//             <div className="modal-header">
//               <h3 style={{ color: "darkgray" }}>{t("CreateNewRole")}</h3>
//               <button className="close-btn" onClick={() => setShowAddRoleModal(false)}>
//                 <X size={18} />
//               </button>
//             </div>
//             <form onSubmit={handleAddRole} className="modal-form">
//               <input type="text" name="role" placeholder={t("enterRoleName")} required />
//               <button type="submit" className="save-btn">
//                 {t("create")}
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default RolesManagement;