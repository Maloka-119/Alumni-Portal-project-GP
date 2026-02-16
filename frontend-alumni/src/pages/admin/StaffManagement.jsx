

import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import './AlumniManagement.css';
import { useTranslation } from "react-i18next";
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import { getPermission } from '../../components/usePermission';

const StaffManagement = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const { t } = useTranslation();
  const navigate = useNavigate();

  const perm = currentUser?.userType === "admin"
  ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
  : getPermission("Staff management", currentUser) || { canView: false, canAdd: false, canEdit: false, canDelete: false };


  useEffect(() => {
    if (!perm.canView) return;

    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await API.get("/staff"); 
        setUsers(res.data.data);
      } catch (err) {
        console.error("Failed to fetch staff data:", err);
        setError(t("loadingError"));
      } finally {
        setLoading(false);
      }
    };
  
    fetchStaff();
  }, [perm.canView]);

  const toggleUserStatus = async (staffId) => {
    if (!perm.canEdit) return;

    const user = users.find(u => u['staff_id'] === staffId);
    if (!user) return;

    const newStatus = user['status-to-login'] === 'active' ? 'inactive' : 'active';

    try {
      await API.put(`/staff/${staffId}/status`, { status: newStatus });
      setUsers(users.map(u =>
        u['staff_id'] === staffId ? { ...u, 'status-to-login': newStatus } : u
      ));

      Swal.fire({
        icon: newStatus === "active" ? "success" : "error",
        title: t(newStatus === "active" ? "Account activated" : "Account deactivated"),
        text: t(newStatus === "active" 
                ? "The staff member can now log in ." 
                : "The staff member is now prevented from logging in ."),
        showConfirmButton: false,
        timer: 1800,
        toast: true,
        position: "top-end",
        background: "#fefefe",
        color: "#333",
      });      

    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const openRoleModal = async (staffId) => {
    if (!perm.canAdd) return;

    setCurrentUserId(staffId);
    setShowModal(true);

    try {
      const res = await API.get('/roles/get-all-roles');
      setRoles(Array.isArray(res.data.roles) ? res.data.roles : []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const handleSaveRole = async () => {
    if (!perm.canAdd || !selectedRole || !currentUserId) return;

    try {
      const user = users.find(u => u.staff_id === currentUserId);
      const currentRoles = user.Roles ? user.Roles.map(r => r.id) : [];

      const payload = {
        staffId: currentUserId,
        roles: [...currentRoles, parseInt(selectedRole)]
      };

      await API.post('/roles/assign-role', payload);
      const usersRes = await API.get('/staff');
      setUsers(usersRes.data.data);

    } catch (err) {
      console.error('Failed to assign role:', err);
    } finally {
      setShowModal(false);
      setSelectedRole('');
      setCurrentUserId(null);
    }
  };

  if (!perm.canView) return <p>{t("noPermission")}</p>;

  const filteredUsers = users.filter(user => {
    const matchesStatus = statusFilter === 'All' ? true : user['status-to-login'] === statusFilter;
    const matchesSearch =
      user.User['first-name'].toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.User['last-name'].toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.User['national-id'].includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <UserManagement activeTabName="Staff" />

      <div className="filter-container" style={{ marginBottom: '16px' }}>
      <label>{t("Status")}</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">{t("all")}</option>
          <option value="active">{t("active")}</option>
          <option value="inactive">{t("inactive")}</option>
        </select>

        <input
          type="text"
          placeholder={t("searchByNameOrNationalId")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            marginLeft: '16px',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid #d1d5db',
            outline: 'none',
            fontSize: '14px',
            width: '250px',
            transition: 'all 0.2s ease-in-out',
            backgroundColor: "#f9fafb",
          }}
          onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
          onBlur={(e) => e.target.style.borderColor = '#ccc'}
        />
      </div>

      <div className="table-container">
        {loading && <p>{t("loadingStaffData")}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && (
          <table className="users-table">
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("nationalId")}</th>
                <th>{t("staffId")}</th>
                <th>{t("role")}</th>
                <th>{t("status")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user['staff_id']} className="table-row">
                  <td>{user.User['first-name']} {user.User['last-name']}</td>
                  <td>{user.User['national-id']}</td>
                  <td>{user['staff_id']}</td>
                  <td>
                    {user.Roles && user.Roles.length > 0
                      ? user.Roles.map(role => role['role-name']).join(', ')
                      : '-'}
                  </td>
                  <td>
                    <span className={`status-badge ${user['status-to-login'].toLowerCase()}`}>
                      {user['status-to-login']}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {perm.canAdd && (
                      <button
                        className="add-button"
                        title="Add Role"
                        onClick={() => openRoleModal(user['staff_id'])}
                      >
                        +
                      </button>
                    )}
                    {perm.canEdit && (
                      <button
                        onClick={() => toggleUserStatus(user['staff_id'])}
                        className={`toggle-switch ${user['status-to-login'].toLowerCase() === 'active' ? 'active' : ''}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && perm.canAdd && (
        <div className="modal">
          <div className="modal-content">
            <h3>{t("selectExistingRole")}</h3>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">-- choose role --</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role['role-name']}
                </option>
              ))}
            </select>

            <h3>{t("or")}</h3>
            <button
              onClick={() => navigate('/helwan-alumni-portal/admin/dashboard/permissionsRoles')}
              style={{
                backgroundColor: 'transparent',
                color: '#1e3a8a',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '42px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {t("createNewRole")}
            </button>

            <div className="modal-actions">
              <button onClick={handleSaveRole}>{t("save")}</button>
              <button onClick={() => setShowModal(false)}>{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;

