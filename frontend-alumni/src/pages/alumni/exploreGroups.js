// src/pages/ExploreGroups.js
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import "./ExploreGroups.css";

function ExploreGroups() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await API.get("/groups");
        setGroups(res.data.data || []);
      } catch (err) {
        console.error("Error fetching groups:", err);
      }
    };

    const fetchMyGroups = async () => {
      try {
        const res = await API.get("/groups/my-groups");
        setMyGroups(res.data.data || []);
      } catch (err) {
        console.error("Error fetching my groups:", err);
      }
    };

    fetchGroups();
    fetchMyGroups();
  }, []);

  const handleJoin = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      await API.post(
        "/groups/join",
        { groupId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const res = await API.get("/groups/my-groups", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMyGroups(res.data.data || []);

      alert("You joined the group successfully!");
    } catch (err) {
      console.error("Error joining group:", err);
      alert("Failed to join group, please try again.");
    }
  };

  return (
    <div className="explore-container">
      <h2>{t("communities")}</h2>

      <div className="explore-grid">
        {groups.map((g) => {
          const joined = myGroups.some((mg) => mg.id === g.id);
          return (
            <div key={g.id} className="explore-card">
              <div className="explore-card-header">
                <h3>{g.groupName}</h3>
                <span className="explore-badge">
                  {g.membersCount} {t("members")}
                </span>
              </div>
              <p className="explore-description">{g.description}</p>

             <div style={{ display: "flex", gap: "10px" }}>
  <button
    onClick={() => handleJoin(g.id)}
    disabled={joined}
    className={`explore-btn ${
      joined ? "explore-btn-gray" : "explore-btn-blue"
    }`}
  >
    {joined ? t("joined") : t("join")}
  </button>

  {joined && (
    <a
      href={`/groups/${g.id}`}
      className="explore-btn explore-btn-blue explore-link-btn"
    >
      Go to community
    </a>
  )}
</div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ExploreGroups;
