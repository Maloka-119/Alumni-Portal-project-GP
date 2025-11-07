import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import GroupDetails from "../alumni/GroupDetails";
import "./ExploreGroups.css";
import Swal from "sweetalert2";
function ExploreGroups() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyGroups(res.data.data || []);

      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, membersCount: (g.membersCount || 0) + 1 }
            : g
        )
      );

       Swal.fire({
        icon: "success",
        title: t("You joined the community successfully!"),
        showConfirmButton: false,
        timer: 1800,
      });
    } catch {
     Swal.fire({
        icon: "error",
        title: t("Failed to join community"),
        text: t("Please try again later."),
      });
    }
  };

  if (selectedGroup) {
    return <GroupDetails group={selectedGroup} goBack={() => setSelectedGroup(null)} />;
  }

  // فلترة المجموعات بناءً على السيرش
  const filteredGroups = groups.filter((g) =>
    g.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="explorer-wrapper">
      <h2 className="uni-header">{t("communities")}</h2>

      {/* Search Bar */}
      <input
        type="text"
        placeholder={t("Search communities")}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="explorer-search"
      />

      <div className="explorer-grid">
        {filteredGroups.map((g) => {
          const joined = myGroups.some((mg) => mg.id === g.id);
          return (
            <div key={g.id} className="explorer-card">
              {g.groupImage && (
                <div className="explorer-card-image">
                  <img src={g.groupImage} alt={g.groupName} />
                </div>
              )}
              <h3 className="explorer-name">{g.groupName}</h3>
              <div className="explorer-card-top">
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
