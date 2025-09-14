import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import './GradProfile.css';
import GraduatedProfileView from './GraduatedProfileView';
import { useTranslation } from "react-i18next";
import API from '../../services/api';


const AlumniManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    API.get("/users") 
      .then(res => {
        const graduatedUsers = res.data.filter(u => u.role === 'graduated');
        setUsers(graduatedUsers);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        setError(t("loadingError"));
        setLoading(false);
      });
  }, []);

  const toggleUserStatus = async (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
  
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
  
    try {
      const res = await API.patch(`/graduates/${id}/status`, { status: newStatus });
      setUsers(users.map(u =>
        u.id === id ? { ...u, status: newStatus } : u
      ));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };
  

  const handleShowProfile = async (user) => {
    try {
      const res = await API.get(`/users/${user.id}`);
      setSelectedUser(res.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  return (
    <div>
      <UserManagement activeTabName={t("alumni")} />

      <div className="table-container">
        {loading && <p>{t("loadingAlumniData")}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && (
          <table className="users-table">
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("nationalId")}</th>
                <th>{t("graduationYear")}</th>
                <th>{t("status")}</th>
                <th>{t("alumniId")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="table-row">
                  <td>{user.name}</td>
                  <td>{user.nationalId}</td>
                  <td>{user.graduationYear}</td>
                  <td>
                    <span className={`status-badge ${user.status.toLowerCase()}`}>
                      {t(user.status)}
                    </span>
                  </td>
                  <td>{user.alumniId}</td>
                  <td className="actions-cell">
                    <button
                      className="show-button"
                      onClick={() => handleShowProfile(user)}
                    >
                      {t("showProfile")}
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

      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <GraduatedProfileView user={selectedUser} />
            <button className="close-button" onClick={handleCloseModal}>
              {t("Close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniManagement;





// import React, { useState } from 'react';
// import UserManagement from './UserManagement';
// import './GradProfile.css';
// import GraduatedProfileView from './GraduatedProfileView';

// const AlumniManagement = () => {
//   const [users, setUsers] = useState([
//     { id: 1, name: 'Ahmed Hassan', nationalId: '29801012345467', graduationYear: '2020', status: 'Active', alumniId: 'ALU2025-12' },
//     { id: 2, name: 'Sara Mohamed', nationalId: '29905098765543', graduationYear: '2022', status: 'Active', alumniId: 'ALU2025-1' },
//     { id: 3, name: 'Omar Ali', nationalId: '29712012378890', graduationYear: '2019', status: 'Inactive', alumniId: 'ALU2025-9' },
//     { id: 4, name: 'Hassan Salah', nationalId: '24801056345467', graduationYear: '2002', status: 'Active', alumniId: 'ALU2025-31' },
//     { id: 5, name: 'Aya Ali', nationalId: '29801012345467', graduationYear: '2010', status: 'Active', alumniId: 'ALU2025-25' },
//     { id: 6, name: 'Menna Zein', nationalId: '29712012345905', graduationYear: '2006', status: 'Active', alumniId: 'ALU2025-13' }
//   ]);

//   const [selectedUser, setSelectedUser] = useState(null);

//   const toggleUserStatus = (id) => {
//     setUsers(users.map(user => 
//       user.id === id 
//         ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
//         : user
//     ));
//   };

//   const handleShowProfile = (user) => {
//     setSelectedUser(user);
//   };

//   const handleCloseModal = () => {
//     setSelectedUser(null);
//   };

//   return (
//     <div>
//       <UserManagement activeTabName="Alumni" />

//       <div className="table-container">
//         <table className="users-table">
//           <thead>
//             <tr>
//               <th>Name</th>
//               <th>National ID</th>
//               <th>Graduation Year</th>
//               <th>Status</th>
//               <th>Alumni ID</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {users.map((user) => (
//               <tr key={user.id} className="table-row">
//                 <td>{user.name}</td>
//                 <td>{user.nationalId}</td>
//                 <td>{user.graduationYear}</td>
//                 <td>
//                   <span className={`status-badge ${user.status.toLowerCase()}`}>
//                     {user.status}
//                   </span>
//                 </td>
//                 <td>{user.alumniId}</td>
//                 <td className="actions-cell">
//                   <button 
//                     className="show-button"
//                     onClick={() => handleShowProfile(user)}
//                   >
//                     Show Profile
//                   </button>
//                   <button
//                     onClick={() => toggleUserStatus(user.id)}
//                     className={`toggle-switch ${user.status === 'Active' ? 'active' : ''}`}
//                   >
//                     <span className="toggle-slider"></span>
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Profile Modal */}
//       {selectedUser && (
//   <div className="modal-overlay">
//     <div className="modal-content">
//       <GraduatedProfileView user={selectedUser} />
//       <button className="close-button" onClick={handleCloseModal}>
//         Close
//       </button>
//     </div>
//   </div>
// )}

//     </div>
//   );
// };

// export default AlumniManagement;
