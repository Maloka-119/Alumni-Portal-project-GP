import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import GroupDetails from "../alumni/GroupDetails"; 
import "./ExploreGroups.css";

function ExploreGroups() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null); 

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

    // تحديث الـ myGroups
    const res = await API.get("/groups/my-groups", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setMyGroups(res.data.data || []);

    // تحديث عدد الأعضاء فورًا في الـ groups
    setGroups((prevGroups) =>
      prevGroups.map((g) =>
        g.id === groupId
          ? { ...g, membersCount: (g.membersCount || 0) + 1 }
          : g
      )
    );

    alert("You joined the community successfully!");
  } catch (err) {
    console.error("Error joining community:", err);
    alert("Failed to join community, please try again.");
  }
};


  if (selectedGroup) {
    
    return <GroupDetails group={selectedGroup} goBack={() => setSelectedGroup(null)} />;
  }

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
                  <button
                    onClick={() => setSelectedGroup(g)}
                    className="explore-btn explore-btn-blue explore-link-btn"
                  >
                    {t("goToGroup")}
                  </button>
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
