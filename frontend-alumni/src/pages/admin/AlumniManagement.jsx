import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import './GradProfile.css';
import GraduatedProfileView from './GraduatedProfileView';
import { useTranslation } from "react-i18next";
import API from '../../services/api';
import GraduateRequests from './GraduateRequests'; 
import Swal from "sweetalert2";

const AlumniManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("inPortal"); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [debouncedSearch, setDebouncedSearch] = useState(""); 
  const { t } = useTranslation();

  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (activeTab !== "inPortal") return;
    setLoading(true);

    API.get("/graduates/approved")
      .then(res => {
        const mappedUsers = res.data.data.map(g => ({
          id: g.User.id,
          name: `${g.User.firstName} ${g.User.lastName}`,
          nationalId: g.User.nationalId,
          graduationYear: g["graduation-year"] || "-",
          status: g.status || "inactive",
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
  }, [activeTab, t]);

  const toggleUserStatus = async (alumniId) => {
    const user = users.find(u => u.alumniId === alumniId);
    if (!user) return;

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const token = localStorage.getItem("token");

    try {
      const res = await API.put(
        `/graduates/${alumniId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === "success") {
        setUsers(users.map(u =>
          u.alumniId === alumniId ? { ...u, status: newStatus } : u
        ));
        Swal.fire({
          icon: newStatus === "active" ? "success" : "error",
          title: newStatus === "active" 
            ? "Account activated"
            : "Account deactivated",
          text: newStatus === "active"
            ? "The graduate can now create posts in the Alumni Portal."
            : "The graduate is now prevented from creating posts and cannot log in.",
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
          title: "Error updating status",
          showConfirmButton: true,
        });
      }
    } catch (err) {
      console.error("Error updating status:", err);
      Swal.fire({
        icon: "error",
        title: "Connection failed",
        text: "Please try again later",
        showConfirmButton: true,
      });
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

  
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    u.alumniId.toString().includes(debouncedSearch)
  );

  return (
    <div>
      <UserManagement activeTabName={t("alumni")} />

      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === "inPortal" ? "active" : ""}`}
          onClick={() => setActiveTab("inPortal")}
        >
          {t("InPortal")}
        </button>
        <button
          className={`tab-button ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          {t("Requests")}
        </button>
      </div>

      {activeTab === "inPortal" && (
        <div className="table-container">
          <input
            type="text"
            placeholder={t("searchByNameOrId")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ marginBottom: "15px", padding: "8px", width: "250px" }}
          />

          {loading && <p>{t("loadingAlumniData")}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          {!loading && !error && (
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t("alumniId")}</th>
                  <th>{t("name")}</th>
                  <th>{t("nationalId")}</th>
                  <th>{t("graduationYear")}</th>
                  <th>{t("status")}</th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td>{user.alumniId}</td>
                    <td>{user.name}</td>
                    <td>{user.nationalId}</td>
                    <td>{user.graduationYear}</td>
                    <td>
                      <span className={`status-badge ${user.status.toLowerCase()}`}>
                        {t(user.status)}
                      </span>
                    </td>
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
      )}

      {activeTab === "requests" && <GraduateRequests />}

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

