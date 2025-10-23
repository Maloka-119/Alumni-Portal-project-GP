import React, { useState, useEffect } from "react";
import "./GradProfile.css";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import Swal from "sweetalert2";
const GraduateRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [graduationYear, setGraduationYear] = useState("");
  const [college, setCollege] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
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
  }, [t]);

  const openModal = (alumniId) => {
    setSelectedAlumni(alumniId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setGraduationYear("");
    setCollege("");
    setSelectedAlumni(null);
  };


const handleAccept = async () => {
  if (!graduationYear || !college) return;

  try {
    const token = localStorage.getItem("token");
    await API.put(
      `/graduates/approve/${selectedAlumni}`,
      { graduationYear, faculty: college },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setRequests((prev) =>
      prev.filter((r) => r.alumniId !== selectedAlumni)
    );
    closeModal();

    Swal.fire({
      icon: "success",
      title: "Account accepted!",
     text: "The graduate can now log in to the Alumni Portal and create posts.",
      showConfirmButton: false,
      timer: 1800,
      toast: true,
      position: "top-end",
      background: "#fefefe",
      color: "#333",
    });
  } catch (err) {
    console.error("Error approving request:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to approve the request. Please try again.",
    });
  }
};

 const handleReject = async (alumniId) => {
  try {
    const token = localStorage.getItem("token");
    await API.put(
      `/graduates/reject/${alumniId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setRequests((prev) => prev.filter((r) => r.alumniId !== alumniId));

    Swal.fire({
      icon: "error",
      title: " Request rejected",
      text: "The graduate request has been rejected. The graduate cannot log in to the Alumni Portal.",
      showConfirmButton: false,
      timer: 1800,
      toast: true,
      position: "top-end",
      background: "#fefefe",
      color: "#333",
    });
  } catch (err) {
    console.error("Error rejecting request:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to reject the request. Please try again.",
    });
  }
};

  return (
    <div className="table-container">
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
            {requests.length > 0 ? (
              requests.map((user) => (
                <tr key={user.id} className="table-row">
                  <td>{user.alumniId}</td>
                  <td>{user.name}</td>
                  <td>{user.nationalId}</td>
                  <td>{user.phoneNumber}</td>
                  <td className="actions-cell">
                    <button
                      className="showre-button"
                      onClick={() => openModal(user.alumniId)}
                    >
                      {t("Accept")}
                    </button>
                    <button
                      className="deletere-button"
                      onClick={() => handleReject(user.alumniId)}
                    >
                      {t("Reject")}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  {t("No Requests In Alumni Portal")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{t("Approve Graduate")}</h3>
            <label>
              {t("Graduation Year")}:
              <input
                type="text"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
              />
            </label>
            <label>
              {t("College")}:
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button onClick={handleAccept}>{t("Submit")}</button>
              <button onClick={closeModal}>{t("Cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraduateRequests;
