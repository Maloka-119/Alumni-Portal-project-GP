import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import './AlumniManagement.css';
import { useTranslation } from "react-i18next";
import API from '../../services/api';


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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await API.get('/all-users'); 
        const staffUsers = res.data.filter(u => u.role === 'staff'); 
        setUsers(staffUsers);
      } catch (err) {
        console.error('Failed to fetch staff data:', err);
        setError(t("loadingError"));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleUserStatus = async (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await API.patch(`/all-users/${id}`, { status: newStatus });
      setUsers(users.map(u =>
        u.id === id ? { ...u, status: newStatus } : u
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const openRoleModal = async (userId) => {
    setCurrentUserId(userId);
    setShowModal(true);

    try {
      const res = await API.get('/roles');
      setRoles(res.data);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const handleSaveRole = async () => {
    try {
      if (selectedRole) {
        await API.post(`/all-users/${currentUserId}/add-role`, { roleId: selectedRole });
      } else if (newRole) {
        await API.post('/roles', { name: newRole });
      }
    } catch (err) {
      console.error('Failed to save role:', err);
    } finally {
      setShowModal(false);
      setSelectedRole('');
      setNewRole('');
      setCurrentUserId(null);
    }
  };

  const filteredUsers = users.filter(user =>
    statusFilter === 'All' ? true : user.status === statusFilter
  );

  return (
    <div>
      <UserManagement activeTabName="Staff" />

      <div className="filter-container">
        <label>Status: </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="All">{t("all")}</option>
<option value="Pending">{t("pending")}</option>
<option value="Active">{t("active")}</option>
<option value="Inactive">{t("inactive")}</option>
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
                <tr key={user.id} className="table-row">
                  <td>{user.name}</td>
                  <td>{user.nationalId}</td>
                  <td>{user.Role}</td>
                  <td>
                    <span className={`status-badge ${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="add-button"
                      onClick={() => openRoleModal(user.id)}
                    >
                      +
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`toggle-switch ${user.status === 'Active' ? 'active' : ''}`}
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
                  {role.name}
                </option>
              ))}
            </select>

            <h3>{t("orCreateNewRole")}</h3>
            <input
              type="text"
              placeholder={t("enterNewRoleName")}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            />

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