import { useEffect, useState } from "react";
import API from "../../services/api"; 
import GroupDetails from "../alumni/GroupDetails"; 
import "./MyGroups.css"; 

function MyGroups() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null); // ✅ عشان نعرض تفاصيل جروب معين

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await API.get("/groups/my-groups");
        console.log("Groups from API:", res.data);
        setGroups(res.data.data || []); 
      } catch (err) {
        console.error("Error fetching groups:", err);
        setGroups([]); 
      }
    };

    fetchGroups();
  }, []);

  const handleLeave = async (groupId) => {
    try {
      const res = await API.delete(`/groups/leave/${groupId}`);
      console.log("Leave response:", res.data);

      if (res.data.status === "success") {
        const updatedGroups = groups.filter((g) => g.id !== groupId);
        setGroups(updatedGroups);
        alert("You left the community successfully!");
      } else {
        alert(res.data.message || "Failed to leave the community.");
      }
    } catch (err) {
      console.error("Error leaving community:", err.response?.data || err.message);
      alert("Failed to leave the community, please try again.");
    }
  };

  if (selectedGroup) {
    // ✅ لو فيه جروب متحدد نعرض GroupDetails
    return <GroupDetails group={selectedGroup} goBack={() => setSelectedGroup(null)} />;
  }

  return (
    <div className="mygroups-container">
      <h2 className="title">My Communities</h2>

      {groups.length === 0 ? (
        <p className="no-groups">No Communities found</p>
      ) : (
        <div className="groups-list">
          {groups.map((g) => (
            <div key={g.id} className="group-card">
              <span className="members-badge">{g.membersCount} Members</span>

              <h3>{g.groupName}</h3>
              <p>{g.description}</p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(g.createdDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>

              <div className="actions">
                <button onClick={() => setSelectedGroup(g)} className="btn go-btn">
                  View
                </button>
                <button
                  onClick={() => handleLeave(g.id)}
                  className="btn leave-btn"
                >
                  Leave community
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyGroups;
// correct without group details
// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import API from "../../services/api"; 
// import "./MyGroups.css"; 

// function MyGroups() {
//   const [groups, setGroups] = useState([]);

// useEffect(() => {
//   const fetchGroups = async () => {
//     try {
//       const res = await API.get("/groups/my-groups");
//       console.log("Groups from API:", res.data);
//       setGroups(res.data.data || []); // ✅ ضمان إنها تبقى array
//     } catch (err) {
//       console.error("Error fetching groups:", err);
//       setGroups([]); // ✅ fallback في حالة الخطأ
//     }
//   };

//   fetchGroups();
// }, []);

//  const handleLeave = async (groupId) => {
//   try {
//     const res = await API.delete(`/groups/leave/${groupId}`);
//     console.log("Leave response:", res.data);

//     if (res.data.status === "success") {
//       const updatedGroups = groups.filter((g) => g.id !== groupId);
//       setGroups(updatedGroups);
//       alert("You left the group successfully!");
//     } else {
//       alert(res.data.message || "Failed to leave the group.");
//     }
//   } catch (err) {
//     console.error("Error leaving group:", err.response?.data || err.message);
//     alert("Failed to leave the group, please try again.");
//   }
// };

//   return (
//     <div className="mygroups-container">
//       <h2 className="title">My Communities</h2>

//       {groups.length === 0 ? (
//         <p className="no-groups">No Communities found</p>
//       ) : (
//         <div className="groups-list">
//           {groups.map((g) => (
//             <div key={g.id} className="group-card">
//               {/* Badge عدد الأعضاء */}
//               <span className="members-badge">{g.membersCount} Members</span>


//               <h3>{g.groupName}</h3>
//               <p>{g.description}</p>
//               <p>
//                 <strong>Created:</strong>{" "}
//                 {new Date(g.createdDate).toLocaleDateString("en-US", {
//                   year: "numeric",
//                   month: "short",
//                   day: "numeric",
//                 })}
//               </p>

//               <div className="actions">
//                 <Link to={`/groups/${g.id}`} className="btn go-btn">
//                   View 
//                 </Link>
//                 <button
//                   onClick={() => handleLeave(g.id)}
//                   className="btn leave-btn"
//                 >
//                   Leave community
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default MyGroups;

// import { useEffect, useState } from "react";
// import API from "../../services/api"; 
// import GroupDetails from "../alumni/GroupDetails"; 
// import "./MyGroups.css"; 

// function MyGroups() {
//   const [groups, setGroups] = useState([]);
//   const [selectedGroup, setSelectedGroup] = useState(null); // ✅ عشان نعرض تفاصيل جروب معين

//   useEffect(() => {
//     const fetchGroups = async () => {
//       try {
//         const res = await API.get("/groups/my-groups");
//         console.log("Groups from API:", res.data);
//         setGroups(res.data.data || []); 
//       } catch (err) {
//         console.error("Error fetching groups:", err);
//         setGroups([]); 
//       }
//     };

//     fetchGroups();
//   }, []);

//   const handleLeave = async (groupId) => {
//     try {
//       const res = await API.delete(`/groups/leave/${groupId}`);
//       console.log("Leave response:", res.data);

//       if (res.data.status === "success") {
//         const updatedGroups = groups.filter((g) => g.id !== groupId);
//         setGroups(updatedGroups);
//         alert("You left the community successfully!");
//       } else {
//         alert(res.data.message || "Failed to leave the community.");
//       }
//     } catch (err) {
//       console.error("Error leaving community:", err.response?.data || err.message);
//       alert("Failed to leave the community, please try again.");
//     }
//   };

//   if (selectedGroup) {
//     // ✅ لو فيه جروب متحدد نعرض GroupDetails
//     return <GroupDetails group={selectedGroup} goBack={() => setSelectedGroup(null)} />;
//   }

//   return (
//     <div className="mygroups-container">
//       <h2 className="title">My Communities</h2>

//       {groups.length === 0 ? (
//         <p className="no-groups">No Communities found</p>
//       ) : (
//         <div className="groups-list">
//           {groups.map((g) => (
//             <div key={g.id} className="group-card">
//               <span className="members-badge">{g.membersCount} Members</span>

//               <h3>{g.groupName}</h3>
//               <p>{g.description}</p>
//               <p>
//                 <strong>Created:</strong>{" "}
//                 {new Date(g.createdDate).toLocaleDateString("en-US", {
//                   year: "numeric",
//                   month: "short",
//                   day: "numeric",
//                 })}
//               </p>

//               <div className="actions">
//                 <button onClick={() => setSelectedGroup(g)} className="btn go-btn">
//                   View
//                 </button>
//                 <button
//                   onClick={() => handleLeave(g.id)}
//                   className="btn leave-btn"
//                 >
//                   Leave community
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default MyGroups;
// // correct without group details
// // import { useEffect, useState } from "react";
// // import { Link } from "react-router-dom";
// // import API from "../../services/api"; 
// // import "./MyGroups.css"; 

// // function MyGroups() {
// //   const [groups, setGroups] = useState([]);

// // useEffect(() => {
// //   const fetchGroups = async () => {
// //     try {
// //       const res = await API.get("/groups/my-groups");
// //       console.log("Groups from API:", res.data);
// //       setGroups(res.data.data || []); // ✅ ضمان إنها تبقى array
// //     } catch (err) {
// //       console.error("Error fetching groups:", err);
// //       setGroups([]); // ✅ fallback في حالة الخطأ
// //     }
// //   };

// //   fetchGroups();
// // }, []);

// //  const handleLeave = async (groupId) => {
// //   try {
// //     const res = await API.delete(`/groups/leave/${groupId}`);
// //     console.log("Leave response:", res.data);

// //     if (res.data.status === "success") {
// //       const updatedGroups = groups.filter((g) => g.id !== groupId);
// //       setGroups(updatedGroups);
// //       alert("You left the group successfully!");
// //     } else {
// //       alert(res.data.message || "Failed to leave the group.");
// //     }
// //   } catch (err) {
// //     console.error("Error leaving group:", err.response?.data || err.message);
// //     alert("Failed to leave the group, please try again.");
// //   }
// // };

// //   return (
// //     <div className="mygroups-container">
// //       <h2 className="title">My Communities</h2>

// //       {groups.length === 0 ? (
// //         <p className="no-groups">No Communities found</p>
// //       ) : (
// //         <div className="groups-list">
// //           {groups.map((g) => (
// //             <div key={g.id} className="group-card">
// //               {/* Badge عدد الأعضاء */}
// //               <span className="members-badge">{g.membersCount} Members</span>


// //               <h3>{g.groupName}</h3>
// //               <p>{g.description}</p>
// //               <p>
// //                 <strong>Created:</strong>{" "}
// //                 {new Date(g.createdDate).toLocaleDateString("en-US", {
// //                   year: "numeric",
// //                   month: "short",
// //                   day: "numeric",
// //                 })}
// //               </p>

// //               <div className="actions">
// //                 <Link to={`/groups/${g.id}`} className="btn go-btn">
// //                   View 
// //                 </Link>
// //                 <button
// //                   onClick={() => handleLeave(g.id)}
// //                   className="btn leave-btn"
// //                 >
// //                   Leave community
// //                 </button>
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default MyGroups;
