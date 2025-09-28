import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function ExploreGroups() {
  const { t } = useTranslation();
  const allGroups = [
    { id: 1, groupName: "React Lovers", description: "مجموعة لعشاق React" },
    { id: 2, groupName: "NodeJS Devs", description: "مجموعة لمطوري NodeJS" },
    { id: 3, groupName: "Frontend Friends", description: "مجموعة لتبادل خبرات Frontend" },
    { id: 4, groupName: "Pythonistas", description: "مجموعة لمبرمجي Python" },
  ];

  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [myGroups, setMyGroups] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("myGroups") || "[]");
    setMyGroups(saved);
  }, []);

  useEffect(() => {
    const filtered = allGroups.filter(
      (g) =>
        g.groupName.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase())
    );
    setGroups(filtered);
  }, [search]);

  const handleJoin = (group) => {
    if (myGroups.some((g) => g.id === group.id)) return;
    const updated = [...myGroups, group];
    setMyGroups(updated);
    localStorage.setItem("myGroups", JSON.stringify(updated));
  };

  return (
    <div className="explore-container">
      <h2>{t("communities")}</h2>
      <input
        type="text"
        placeholder={t("filterByType")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field"
      />

      <div className="groups-list">
        {groups.map((g) => {
          const joined = myGroups.some((mg) => mg.id === g.id);
          return (
            <div key={g.id} className="card">
              <div>
                <h3>{g.groupName}</h3>
                <p className="text-secondary">{g.description}</p>
              </div>
              <button
                onClick={() => handleJoin(g)}
                disabled={joined}
                className={`btn ${joined ? "btn-gray" : "btn-blue"}`}
              >
                {joined ? t("joined") : t("join")}
              </button>
            </div>
          );
        })}
      </div>

      {/* CSS داخلية */}
      <style jsx>{`
        .explore-container {
          padding: 20px;
          background-color: #F7F7F7;
          min-height: 100vh;
          color: #4A4A4A;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        h2 { margin-bottom: 20px; }
        h3 { margin: 0 0 5px 0; }
        .text-secondary { color: #828282; }
        .groups-list { width: 100%; max-width: 600px; }
        .card {
          border: 1px solid #828282;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 5px;
          background-color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .input-field {
          border: 1px solid #828282;
          border-radius: 5px;
          padding: 8px;
          width: 100%;
          margin-bottom: 20px;
          box-sizing: border-box;
        }
        .btn {
          padding: 6px 12px;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          color: #fff;
        }
        .btn-blue { background-color: #37568D; }
        .btn-gray { background-color: #828282; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

export default ExploreGroups;
