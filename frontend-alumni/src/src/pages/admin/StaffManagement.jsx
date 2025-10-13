import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import './AlumniManagement.css';
import { useTranslation } from "react-i18next";
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';

const StaffManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [newRole, setNewRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  const [statusFilter, setStatusFilter] = useState('All');
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
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
  }, []);

  const toggleUserStatus = async (staffId) => {
    const user = users.find(u => u['staff_id'] === staffId);
    if (!user) return;

    const newStatus = user['status-to-login'] === 'active' ? 'inactive' : 'active';

    try {
      await API.put(`/staff/${staffId}/status`, { status: newStatus });
      setUsers(users.map(u =>
        u['staff_id'] === staffId ? { ...u, 'status-to-login': newStatus } : u
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const openRoleModal = async (staffId) => {
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
  if (!selectedRole || !currentUserId) return;

  try {
    const user = users.find(u => u.staff_id === currentUserId);
    const currentRoles = user.roles ? user.roles.map(r => r.id) : [];

    const payload = {
      staffId: currentUserId,
      roles: [...currentRoles, parseInt(selectedRole)]
    };

    const res = await API.post('/roles/assign-role', payload);
    console.log('Assign response:', res.data);

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

  const filteredUsers = users.filter(user =>
    statusFilter === 'All' ? true : user['status-to-login'] === statusFilter
  );

  return (
    <div>
      <UserManagement activeTabName="Staff" />

      <div className="filter-container">
        <label>Status: </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">{t("all")}</option>
          <option value="active">{t("active")}</option>
          <option value="inactive">{t("inactive")}</option>
        </select>
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
                  <td>{user.Role || '-'}</td>
                  <td>
                    <span className={`status-badge ${user['status-to-login'].toLowerCase()}`}>
                      {user['status-to-login']}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="add-button"
                      onClick={() => openRoleModal(user['staff_id'])}
                    >
                      +
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user['staff_id'])}
                      className={`toggle-switch ${user['status-to-login'].toLowerCase() === 'active' ? 'active' : ''}`}
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
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



// import React, { useState, useEffect } from 'react';
// import UserManagement from './UserManagement';
// import './AlumniManagement.css';

// const StaffManagement = () => {
//   const [users, setUsers] = useState([]);
//   const [roles, setRoles] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [showModal, setShowModal] = useState(false);
//   const [selectedRole, setSelectedRole] = useState('');
//   const [newRole, setNewRole] = useState('');
//   const [currentUserId, setCurrentUserId] = useState(null);

//   const [statusFilter, setStatusFilter] = useState('All');

//   useEffect(() => {
//     // داتا ثابتة مؤقتة بدل API
//     const dummyUsers = [
//       { id: 1, name: 'Ahmed Ali', nationalId: '123456789', Role: 'Viewer', status: 'Active' },
//       { id: 2, name: 'Sara Mohamed', nationalId: '987654321', Role: 'Editor', status: 'Inactive' },
//       { id: 3, name: 'Omar Hassan', nationalId: '456789123', Role: 'Admin', status: 'Pending' }
//     ];

//     const dummyRoles = [
//       { id: 1, name: 'Admin' },
//       { id: 2, name: 'Editor' },
//       { id: 3, name: 'Viewer' }
//     ];

//     setUsers(dummyUsers);
//     setRoles(dummyRoles);
//     setLoading(false);
//   }, []);

//   const toggleUserStatus = (id) => {
//     setUsers(users.map(user =>
//       user.id === id
//         ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
//         : user
//     ));
//   };

//   const openRoleModal = (userId) => {
//     setCurrentUserId(userId);
//     setShowModal(true);
//   };

//   const handleSaveRole = () => {
//     if (selectedRole) {
//       const roleName = roles.find(r => r.id === parseInt(selectedRole))?.name;
//       setUsers(users.map(u =>
//         u.id === currentUserId ? { ...u, Role: roleName } : u
//       ));
//     } else if (newRole) {
//       const newId = roles.length + 1;
//       const newRoleObj = { id: newId, name: newRole };
//       setRoles([...roles, newRoleObj]);
//       setUsers(users.map(u =>
//         u.id === currentUserId ? { ...u, Role: newRole } : u
//       ));
//     }
//     setShowModal(false);
//     setSelectedRole('');
//     setNewRole('');
//     setCurrentUserId(null);
//   };

//   const filteredUsers = users.filter(user =>
//     statusFilter === 'All' ? true : user.status === statusFilter
//   );

//   return (
//     <div>
//       <UserManagement activeTabName="Staff" />

//       <div className="filter-container">
//         <label>Status: </label>
//         <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
//           <option value="All">All</option>
//           <option value="Pending">Pending</option>
//           <option value="Active">Active</option>
//           <option value="Inactive">Inactive</option>
//         </select>
//       </div>

//       <div className="table-container">
//         {loading && <p>Loading Staff data...</p>}
//         {error && <p style={{ color: 'red' }}>{error}</p>}

//         {!loading && !error && (
//           <table className="users-table">
//             <thead>
//               <tr>
//                 <th>Name</th>
//                 <th>National ID</th>
//                 <th>Role</th>
//                 <th>Status</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredUsers.map(user => (
//                 <tr key={user.id} className="table-row">
//                   <td>{user.name}</td>
//                   <td>{user.nationalId}</td>
//                   <td>{user.Role}</td>
//                   <td>
//                     <span className={`status-badge ${user.status.toLowerCase()}`}>
//                       {user.status}
//                     </span>
//                   </td>
//                   <td className="actions-cell">
//                     <button
//                       className="add-button"
//                       onClick={() => openRoleModal(user.id)}
//                     >
//                       +
//                     </button>
//                     <button
//                       onClick={() => toggleUserStatus(user.id)}
//                       className={`toggle-switch ${user.status === 'Active' ? 'active' : ''}`}
//                     >
//                       <span className="toggle-slider"></span>
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {showModal && (
//         <div className="modal">
//           <div className="modal-content">
//             <h3>Select existing role</h3>
//             <select
//               value={selectedRole}
//               onChange={(e) => setSelectedRole(e.target.value)}
//             >
//               <option value="">-- choose role --</option>
//               {roles.map((role) => (
//                 <option key={role.id} value={role.id}>
//                   {role.name}
//                 </option>
//               ))}
//             </select>

//             <h3>Or create new role</h3>
//             <input
//               type="text"
//               placeholder="Enter new role name"
//               value={newRole}
//               onChange={(e) => setNewRole(e.target.value)}
//             />

//             <div className="modal-actions">
//               <button onClick={handleSaveRole}>Save</button>
//               <button onClick={() => setShowModal(false)}>Cancel</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StaffManagement;