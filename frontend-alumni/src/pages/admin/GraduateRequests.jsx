import React, { useState, useEffect } from "react";
import "./GradProfile.css";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import Swal from "sweetalert2";
import UserManagement from './UserManagement';
import { getPermission } from '../../components/usePermission';


const GraduateRequests = ({ currentUser }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [graduationYear, setGraduationYear] = useState("");
  const [college, setCollege] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [faculties, setFaculties] = useState([]);
const { t , i18n } = useTranslation();

  const perms = currentUser?.userType === "admin"
    ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
    : getPermission("Others Requests management", currentUser) || { canView: false, canAdd: false, canEdit: false, canDelete: false };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (!perms.canView) return;

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await API.get("/graduates/requested");
        const mapped = res.data.data.map((g) => ({
          id: g.User.id,
          name: `${g.User.firstName} ${g.User.lastName}`,
          nationalId: g.User.nationalId,
          phoneNumber: g.User.phoneNumber || "N/A",
          graduationYear: g["graduation-year"] || "N/A",
          alumniId: g.graduate_id,
        }));
        setRequests(mapped);
      } catch (err) {
        console.error("Error fetching graduate requests:", err);
        setError(t("loadingError"));
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [t, perms.canView]);

  const openModal = (alumniId) => { if (!perms.canAdd) return; setSelectedAlumni(alumniId); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setGraduationYear(""); setCollege(""); setSelectedAlumni(null); };

  const handleAccept = async () => {
    if (!perms.canAdd || !graduationYear || !college) return;
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/graduates/approve/${selectedAlumni}`,
        { graduationYear, faculty: college },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(prev => prev.filter(r => r.alumniId !== selectedAlumni));
      closeModal();
      Swal.fire({ icon: "success", title: t("Account accepted!"), text: t("The graduate can now log in to the Alumni Portal and create posts."), showConfirmButton: false, timer: 1800, toast: true, position: "top-end", background: "#fefefe", color: "#333" });
    } catch (err) {
      console.error("Error approving request:", err);
      Swal.fire({ icon: "error", title: t("Error"), text: t("Failed to approve the request. Please try again.") });
    }
  };

  const handleReject = async (alumniId) => {
    if (!perms.canDelete) return;
    try {
      const token = localStorage.getItem("token");
      await API.put(`/graduates/reject/${alumniId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setRequests(prev => prev.filter(r => r.alumniId !== alumniId));
      Swal.fire({ icon: "error", title: t("Request rejected"), text: t("The graduate request has been rejected. The graduate cannot log in to the Alumni Portal."), showConfirmButton: false, timer: 1800, toast: true, position: "top-end", background: "#fefefe", color: "#333" });
    } catch (err) {
      console.error("Error rejecting request:", err);
      Swal.fire({ icon: "error", title: t("Error"), text: t("Failed to reject the request. Please try again.") });
    }
  };

  const filteredRequests = requests.filter((r) =>
    r.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    r.alumniId.toString().includes(debouncedSearch)
  );

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await API.get("/faculties");
        setFaculties(res.data.data);
      } catch (err) {
        console.error("Error fetching faculties:", err);
      }
    };
    fetchFaculties();
  }, []);

  return (
    <div>
      {currentUser.userType === "staff" && (
  <UserManagement activeTabName="requests" />
)}
      <div className="table-container">
        <input
          type="text"
          placeholder={t("searchByNameOrId")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{ marginBottom: "15px", padding: "8px", width: "250px" }}
        />

        {loading && <p>{t("loadingRequests")}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && (
          <table className="users-table">
            <thead>
              <tr>
                <th>{t("alumniId")}</th>
                <th>{t("name")}</th>
                <th>{t("nationalId")}</th>
                <th>{t("phonenumber")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? filteredRequests.map(user => (
                <tr key={user.id} className="table-row">
                  <td>{user.alumniId}</td>
                  <td>{user.name}</td>
                  <td>{user.nationalId}</td>
                  <td>{user.phoneNumber}</td>
                  <td className="actions-cell">
                    {perms.canAdd && <button className="showre-button" onClick={() => openModal(user.alumniId)}>{t("Accept")}</button>}
                    {perms.canDelete && <button className="deletere-button" onClick={() => handleReject(user.alumniId)}>{t("Reject")}</button>}
                  </td>
                </tr>
              )) : <tr><td colSpan="5" style={{ textAlign: "center" }}>{t("No Requests In Alumni Portal")}</td></tr>}
            </tbody>
          </table>
        )}

        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{t("Approve Graduate")}</h3>
              <label>{t("Graduation Year")}:
                <input type="text" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
              </label>
<label>
  {t("College")}
  <select value={college} onChange={(e) => setCollege(e.target.value)}>
    <option value="">{t("Select College")}</option>
    {faculties.map((f) => (
      <option key={f.code} value={f.code}>
        {i18n.language === "ar" ? f.ar : f.en}
      </option>
    ))}
  </select>
</label>


              <div className="modal-actions">
                <button onClick={handleAccept}>{t("Submit")}</button>
                <button onClick={closeModal}>{t("Cancel")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraduateRequests;

