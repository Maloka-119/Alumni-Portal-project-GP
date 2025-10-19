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
      } catch {
        setGroups([]);
      }
    };

    const fetchMyGroups = async () => {
      try {
        const res = await API.get("/groups/my-groups");
        setMyGroups(res.data.data || []);
      } catch {
        setMyGroups([]);
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

      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, membersCount: (g.membersCount || 0) + 1 }
            : g
        )
      );

      alert("You joined the community successfully!");
    } catch {
      alert("Failed to join community, please try again.");
    }
  };

  if (selectedGroup) {
    return <GroupDetails group={selectedGroup} goBack={() => setSelectedGroup(null)} />;
  }

  return (
    <div className="explorer-wrapper">
      <h2 className="uni-header">{t("communities")}</h2>

      <div className="explorer-grid">
        {groups.map((g) => {
          const joined = myGroups.some((mg) => mg.id === g.id);
          return (
            <div key={g.id} className="explorer-card">
              {g.groupImage && (
                <div className="explorer-card-image">
                  <img src={g.groupImage} alt={g.groupName} />
                </div>
              )}

              <div className="explorer-card-top">
                <h3 className="explorer-name">{g.groupName}</h3>
                <span className="explorer-badge">
                  {g.membersCount} {t("members")}
                </span>
              </div>

              <p className="explorer-desc">{g.description}</p>

              <div className="explorer-actions">
                <button
                  onClick={() => handleJoin(g.id)}
                  disabled={joined}
                  className={`explorer-btn ${
                    joined ? "explorer-btn-disabled" : "explorer-btn-primary"
                  }`}
                >
                  {joined ? t("joined") : t("join")}
                </button>

                {joined && (
                  <button
                    onClick={() => setSelectedGroup(g)}
                    className="explorer-btn explorer-btn-secondary"
                  >
                    {t("Go to Community")}
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
