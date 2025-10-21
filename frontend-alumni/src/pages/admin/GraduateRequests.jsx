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
    setLoading(true);
    API.get("/graduates/requests")
      .then((res) => {
        const mapped = res.data.data.map((g) => ({
          id: g.User.id,
          name: `${g.User["first-name"]} ${g.User["last-name"]}`,
          nationalId: g.User["national-id"],
          graduationYear: g["graduation-year"],
          alumniId: g.graduate_id,
        }));
        setRequests(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching graduate requests:", err);
        setError(t("loadingError"));
        setLoading(false);
      });
  }, []);

  const handleAccept = async (alumniId) => {
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/graduates/${alumniId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(requests.filter((r) => r.alumniId !== alumniId));
    } catch (err) {
      console.error("Error approving request:", err);
    }
  };

  const handleRemove = async (alumniId) => {
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/graduates/${alumniId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(requests.filter((r) => r.alumniId !== alumniId));
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
              <th>{t("name")}</th>
              <th>{t("nationalId")}</th>
              <th>{t("graduationYear")}</th>
              <th>{t("alumniId")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((user) => (
              <tr key={user.id} className="table-row">
                <td>{user.name}</td>
                <td>{user.nationalId}</td>
                <td>{user.graduationYear}</td>
                <td>{user.alumniId}</td>
                <td className="actions-cell">
                  <button
                    className="show-button"
                    onClick={() => handleAccept(user.alumniId)}
                  >
                    {t("Accept")}
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleRemove(user.alumniId)}
                  >
                    {t("Remove")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GraduateRequests;
