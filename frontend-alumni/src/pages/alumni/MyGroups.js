// src/pages/MyGroups.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function MyGroups() {
  const initialGroups = [
    { id: 1, groupName: "React Lovers", description: "react" },
    { id: 2, groupName: "NodeJS Devs", description: "NodeJS" },
    { id: 3, groupName: "Frontend Friends", description: "Frontend" },
  ];

  const [groups, setGroups] = useState([]);

  useEffect(() => {
    setGroups(initialGroups);
  }, []);

  const handleLeave = (groupId) => {
    const updatedGroups = groups.filter(g => g.id !== groupId);
    setGroups(updatedGroups);
    alert("You left the group successfully!");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>My Groups</h2>
      {groups.map(g => (
        <div key={g.id} style={{ border: "1px solid #ccc", padding: 15, marginBottom: 10 }}>
          <h3>{g.groupName}</h3>
          <p>{g.description}</p>
          <Link to={`/groups/${g.id}`} style={{ marginRight: 10 }}>Go to Group</Link>
          <button onClick={() => handleLeave(g.id)} style={{ background: "red", color: "white" }}>Leave Group</button>
        </div>
      ))}
    </div>
  );
}

export default MyGroups;

