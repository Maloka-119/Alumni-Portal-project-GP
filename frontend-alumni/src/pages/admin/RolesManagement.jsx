import React, { useState, useEffect } from "react";
import { Trash2, Plus, Eye, X, ChevronRight } from "lucide-react";
import API from "../../services/api";
import "./RolesManagement.css";
import { useTranslation } from "react-i18next";

const RolesManagement = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [rolesData, setRolesData] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [staffList, setStaffList] = useState({});
  const [allStaff, setAllStaff] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const { t } = useTranslation();

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
          };
        });
      });
      setPermissions(permsMap);
  
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };
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
  
        alert(res.data.message);
      } else {
        alert("Failed to remove staff from role");
      }
    } catch (err) {
      console.error("Failed to remove staff from role:", err);
      alert("Error removing staff. Check console for details.");
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
          delete: !!p["can-delete"]
        }))
      }));
    } catch (err) {
      console.error("Failed to fetch role details:", err);
    }
  };
  


  const handleDeleteRole = async (roleName) => {
    if (!window.confirm(`Delete role "${roleName}"?`)) return;
    const roleObj = rolesData.find((r) => r.role_name === roleName);
    if (!roleObj) return alert("Role not found");

    try {
      const res = await API.delete(`/roles/delete/${roleObj.role_id}`);
      if (res.data.status === "success") {
        setRolesData((prev) =>
          prev.filter((r) => r.role_id !== roleObj.role_id)
        );
        if (selectedRole === roleName) setSelectedRole("");
        alert(res.data.message);
      } else {
        alert("Error deleting role");
      }
    } catch (err) {
      console.error("Error deleting role:", err);
      alert("Error deleting role");
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    const roleName = e.target.role.value.trim();
    if (!roleName) return;

    const permissionsPayload = availablePermissions.map((perm) => ({
      permission_id: perm.id,
      "can-view": false,
      "can-edit": false,
      "can-delete": false,
    }));

    try {
      const res = await API.post("/roles/create", {
        roleName,
        permissions: permissionsPayload,
      });

      if (res.data.status === "success") {
        alert(`Role "${roleName}" created successfully`);
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
          })),
        }));
        setSelectedRole(roleName);
        setShowAddRoleModal(false);
      }
    } catch (err) {
      console.error("Error creating role:", err);
      alert("Error creating role");
    }
  };

  const togglePermission = (roleName, index, type) => {
    setPermissions((prev) => {
      const rolePerms = prev[roleName] || [];
      const updated = rolePerms.map((p, i) =>
        i === index ? { ...p, [type]: !p[type] } : p
      );
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
    if (!roleObj) return alert("Role not found");

    const rolePerms = permissions[selectedRole] || [];
    const updatedPermissions = rolePerms.map((p) => ({
      permission_id: p.permission_id,
      "can-view": p.view,
      "can-edit": p.edit,
      "can-delete": p.delete,
    }));

    try {
      const res = await API.put(`/roles/update/${roleObj.role_id}`, {
        roleName: selectedRole,
        permissions: updatedPermissions,
      });

      if (res.data.status === "success") {
        alert("Role updated successfully");
        setPermissions((prev) => ({ ...prev, [selectedRole]: rolePerms }));
        const updatedRoles = rolesData.map((r) =>
          r.role_id === roleObj.role_id
            ? { ...r, permissions: updatedPermissions }
            : r
        );
        setRolesData(updatedRoles);
      } else {
        alert("Failed to update role");
      }
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Error updating role");
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
    }));
  };

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
              <Trash2
                size={14}
                className="delete-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRole(role.role_name);
                }}
              />
              {selectedRole === role.role_name && (
                <ChevronRight size={16} className="active-arrow" />
              )}
            </li>
          ))}
        </ul>
        <button className="add-role-btn" onClick={() => setShowAddRoleModal(true)}>
          <Plus size={16} />{t("CreateNewRole")}
        </button>
      </div>

      <div className="permissions-section">
        <div className="permissions-header">
          <h3 className="page-title">{selectedRole} Permissions</h3>
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
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={!!p.edit}
                    onChange={() => togglePermission(selectedRole, i, "edit")}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={!!p.view}
                    onChange={() => togglePermission(selectedRole, i, "view")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="update-btn-container">
          <button onClick={handleUpdateRole} className="update-role-btn">
          {t("updatePermissions")}
          </button>
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
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteStaff(staff.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="add-staff-btn" onClick={() => setShowAddStaffModal(true)}>
              <Plus size={16} /> {t("addNewStaff")}
            </button>
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
              <input type="text" name="staffId" placeholder="e.g. S104" />
              <h4>{t("or")}</h4>
              <label>{t("selectExistingStaff")}</label>
              <select name="staffSelect" defaultValue="">
                <option value="">{t("chooseStaff")}...</option>
                {allStaff.map((staff) => (
                  <option key={staff.staff_id} value={staff.staff_id}>
                    {staff.staff_id} - {staff.first_name} {staff.last_name}
                  </option>
                ))}
              </select>
              <button type="submit" className="save-btn">
               {t("addToRole")}
              </button>
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
              <input type="text" name="role" placeholder={t("enterRoleName")}required />
              <button type="submit" className="save-btn">
              {t("create")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesManagement;

