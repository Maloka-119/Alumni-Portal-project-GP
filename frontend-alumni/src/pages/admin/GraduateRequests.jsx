import React, { useState, useEffect } from "react";
import "./GradProfile.css";
import { useTranslation } from "react-i18next";
import API from "../../services/api";

const GraduateRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const handleAccept = async (alumniId) => {
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/graduates/approve/${alumniId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests((prev) => prev.filter((r) => r.alumniId !== alumniId));
    } catch (err) {
      console.error("Error approving request:", err);
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
    } catch (err) {
      console.error("Error rejecting request:", err);
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
              <th>{t("graduationYear")}</th>
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
                  <td>{user.graduationYear}</td>
                  <td className="actions-cell">
                    <button
                      className="show-button"
                      onClick={() => handleAccept(user.alumniId)}
                    >
                      {t("Accept")}
                    </button>
                    <button
                      className="delete-button"
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
    </div>
  );
};

export default GraduateRequests;
