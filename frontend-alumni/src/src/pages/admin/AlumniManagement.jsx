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
    API.get("/graduates")
      .then(res => {
        const mappedUsers = res.data.data.map(g => ({
          id: g.User.id,
          name: `${g.User["first-name"]} ${g.User["last-name"]}`,
          nationalId: g.User["national-id"],
          graduationYear: g["graduation-year"],
          status: g.status,
          alumniId: g.graduate_id
        }));
        setUsers(mappedUsers);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching graduated users:", err);
        setError(t("loadingError"));
        setLoading(false);
      });
  }, []);
  
  

const toggleUserStatus = async (alumniId) => {
  const user = users.find(u => u.alumniId === alumniId);
  if (!user) return;

  const newStatus = user.status === 'active' ? 'inactive' : 'active';

  try {
    const token = localStorage.getItem("token"); // أو أي مكان مخزن فيه الـ JWT
    const res = await API.put(
      `/graduates/${alumniId}/status`,
      { status: newStatus },
      {
        headers: {
          Authorization: `Bearer ${token}`  // هنا بنرسل التوكن
        }
      }
    );

    // تحديث الـ state مباشرة بعد النجاح
    setUsers(users.map(u =>
      u.alumniId === alumniId ? { ...u, status: newStatus } : u
    ));
  } catch (err) {
    console.error('Error updating status:', err);
  }
};

  

  const handleShowProfile = async (user) => {
    try {
      const res = await API.get(`/graduates/${user.alumniId}/profile`);
      setSelectedUser(res.data.data);
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
               onClick={() => toggleUserStatus(user.alumniId)}
               className={`toggle-switch ${user.status === 'active' ? 'active' : ''}`}
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




