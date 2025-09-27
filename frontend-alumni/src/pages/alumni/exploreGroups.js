import { useEffect, useState } from "react";

function ExploreGroups() {
  const allGroups = [
    { id: 1, groupName: "React Lovers", description: "مجموعة لعشاق React" },
    { id: 2, groupName: "NodeJS Devs", description: "مجموعة لمطوري NodeJS" },
    { id: 3, groupName: "Frontend Friends", description: "مجموعة لتبادل خبرات Frontend" },
    { id: 4, groupName: "Pythonistas", description: "مجموعة لمبرمجي Python" },
  ];

  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [myGroups, setMyGroups] = useState([]);

  // تحميل الجروبات المنضمة مسبقاً من localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("myGroups") || "[]");
    setMyGroups(saved);
  }, []);

  // فلترة المجموعات حسب البحث
  useEffect(() => {
    const filtered = allGroups.filter(
      (g) =>
        g.groupName.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase())
    );
    setGroups(filtered);
  }, [search]);

  const handleJoin = (group) => {
    if (myGroups.some(g => g.id === group.id)) {
      alert("You already joined this group!");
      return;
    }

    const updated = [...myGroups, group];
    setMyGroups(updated);
    localStorage.setItem("myGroups", JSON.stringify(updated));
    alert(`You joined "${group.groupName}" successfully!`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Explore Groups</h2>
      <input
        type="text"
        placeholder="Search groups..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 20, padding: 8 }}
      />

      <div>
        {groups.map((g) => (
          <div
            key={g.id}
            style={{ border: "1px solid #ccc", padding: 15, marginBottom: 10 }}
          >
            <h3>{g.groupName}</h3>
            <p>{g.description}</p>
            <button onClick={() => handleJoin(g)}>Join</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExploreGroups;
