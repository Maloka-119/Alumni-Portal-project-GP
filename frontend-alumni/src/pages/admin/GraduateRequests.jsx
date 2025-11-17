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
  const { t } = useTranslation();

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
      Swal.fire({ icon: "success", title: "Account accepted!", text: "The graduate can now log in to the Alumni Portal and create posts.", showConfirmButton: false, timer: 1800, toast: true, position: "top-end", background: "#fefefe", color: "#333" });
    } catch (err) {
      console.error("Error approving request:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to approve the request. Please try again." });
    }
  };

  const handleReject = async (alumniId) => {
    if (!perms.canDelete) return;
    try {
      const token = localStorage.getItem("token");
      await API.put(`/graduates/reject/${alumniId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setRequests(prev => prev.filter(r => r.alumniId !== alumniId));
      Swal.fire({ icon: "error", title: "Request rejected", text: "The graduate request has been rejected. The graduate cannot log in to the Alumni Portal.", showConfirmButton: false, timer: 1800, toast: true, position: "top-end", background: "#fefefe", color: "#333" });
    } catch (err) {
      console.error("Error rejecting request:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to reject the request. Please try again." });
    }
  };

  const filteredRequests = requests.filter((r) =>
    r.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    r.alumniId.toString().includes(debouncedSearch)
  );

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
              <label>{t("College")}
  <select value={college} onChange={(e) => setCollege(e.target.value)}>
    <option value="">{t("Select College")}</option>

    <option value="Faculty of Commerce and Business Administration">{t("College_Commerce")}</option>
    <option value="Faculty of Law">{t("College_Law")}</option>
    <option value="Faculty of Arts">{t("College_Arts")}</option>
    <option value="Faculty of Science">{t("College_Science")}</option>
    <option value="Faculty of Engineering (Helwan)">{t("College_Engineering_Helwan")}</option>
    <option value="Faculty of Engineering (Mataria)">{t("College_Engineering_Mataria")}</option>
    <option value="Faculty of Computers and Artificial Intelligence">{t("College_CAI")}</option>
    <option value="Faculty of Industrial Education">{t("College_Industrial_Edu")}</option>
    <option value="Faculty of Education">{t("College_Education")}</option>
    <option value="Faculty of Applied Arts">{t("College_Applied_Arts")}</option>
    <option value="Faculty of Fine Arts">{t("College_Fine_Arts")}</option>
    <option value="Faculty of Physical Education (Men)">{t("College_PE_Men")}</option>
    <option value="Faculty of Physical Education (Women)">{t("College_PE_Women")}</option>
    <option value="Faculty of Music Education">{t("College_Music")}</option>
    <option value="Faculty of Art Education">{t("College_Art_Edu")}</option>
    <option value="Faculty of Social Work">{t("College_Social_Work")}</option>
    <option value="Faculty of Tourism and Hotel Management">{t("College_Tourism")}</option>
    <option value="Faculty of Home Economics">{t("College_Home_Eco")}</option>
    <option value="Faculty of Nursing">{t("College_Nursing")}</option>
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

