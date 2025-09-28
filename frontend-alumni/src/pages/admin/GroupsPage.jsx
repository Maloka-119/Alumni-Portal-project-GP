import React, { useState, useEffect, useRef } from "react";
import "./GroupsPage.css";
import GroupDetail from "./GroupDetail";
import { Edit, Trash2 } from "lucide-react";
import API from "../../services/api";

function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cover: null,
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const previewUrlRef = useRef(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await API.get("/groups");
        if (res.data.status === "success") {
          const mapped = res.data.data.map((g) => ({
            id: g.id,
            name: g.groupName,
            description: g.description,
            cover: g.groupImage,
            createdAt: g.createdDate,
            membersCount: g.membersCount || 0,
          }));
          setGroups(mapped);
        }
      } catch (err) {
        console.error("Error fetching groups", err);
      }
    };
    fetchGroups();
  }, []);

  const openCreateForm = () => {
    cleanupPreview();
    setFormData({ name: "", description: "", cover: null });
    setEditingGroup(null);
    setShowForm(true);
  };

  const openEditForm = (group) => {
    cleanupPreview();
    setFormData({ name: group.name, description: group.description, cover: null });
    if (group.cover) {
      setPreview(group.cover);
    }
    setEditingGroup(group);
    setShowForm(true);
  };

  const cleanupPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("groupName", formData.name);
      data.append("description", formData.description);

      if (formData.cover) {
        data.append("groupImage", formData.cover);
      }

      if (editingGroup) {
        const res = await API.put(`/groups/${editingGroup.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.status === "success") {
          const g = res.data.data[0];
          const updatedGroup = {
            id: g.id,
            name: g.groupName,
            description: g.description,
            cover: g.groupImage || editingGroup.cover,
            createdAt: g.createdDate,
            membersCount: g.membersCount || editingGroup.membersCount || 0,
          };
          setGroups(groups.map((gr) => (gr.id === g.id ? updatedGroup : gr)));
          alert("Group updated successfully");
        }
      } else {
        const res = await API.post("/groups", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.status === "success") {
          const g = res.data.data[0];
          const newGroup = {
            id: g.id,
            name: g.groupName,
            description: g.description,
            cover: g.groupImage,
            createdAt: g.createdDate,
            membersCount: g.membersCount,
          };
          setGroups([...groups, newGroup]);
          alert("Group created successfully");
        }
      }

      cleanupPreview();
      setShowForm(false);
      setEditingGroup(null);
      setFormData({ name: "", description: "", cover: null });
    } catch (err) {
      console.error("Error saving group", err);
      alert("Failed to save group");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      try {
        const res = await API.delete(`/groups/${id}`);
        if (res.data.status === "success") {
          setGroups(groups.filter((g) => g.id !== id));
          alert("Group deleted successfully");
        }
      } catch (err) {
        console.error("Error deleting group", err);
        alert("Failed to delete group");
      }
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        goBack={() => setSelectedGroup(null)}
        updateGroup={(updatedGroup) => {
          setGroups(groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
          setSelectedGroup(updatedGroup);
        }}
      />
    );
  }

  return (
    <div className="container">
      <h1 style={{ color: "#4f46e5" }}>Groups</h1>

      <div className="controls">
        <input
          type="text"
          placeholder="Search group"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={openCreateForm}>Create Group</button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>{editingGroup ? "Edit Group" : "Create New Group"}</h3>

          <input
            type="text"
            placeholder="Group Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              cleanupPreview();
              const file = e.target.files[0];
              setFormData({ ...formData, cover: file });
              if (file) {
                const url = URL.createObjectURL(file);
                setPreview(url);
                previewUrlRef.current = url;
              }
            }}
          />

          {preview && (
            <img
              src={preview}
              alt="Preview"
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover",
                marginTop: "10px",
                borderRadius: "8px",
              }}
            />
          )}

          <button type="submit" disabled={loading}>
            {editingGroup ? "Update Group" : "Add Group"}
          </button>
        </form>
      )}

      <div className="groups-list">
        {filteredGroups.map((g) => (
          <div className="group-card" key={g.id} style={{ position: "relative" }}>
            {g.cover ? (
              <img src={g.cover} alt={g.name} className="cover-img" />
            ) : (
              <div style={{ height: "180px", background: "#ddd" }}></div>
            )}

            <div className="overlay">
              <h2>{g.name}</h2>
            </div>

            <span className="badge">{g.membersCount} members</span>

            <div
              className="card-icons"
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                display: "flex",
                gap: "6px",
              }}
            >
              <Edit
                size={18}
                style={{ cursor: "pointer", color: "#2563EB" }}
                onClick={() => openEditForm(g)}
              />
              <Trash2
                size={18}
                style={{ cursor: "pointer", color: "#DC2626" }}
                onClick={() => handleDeleteGroup(g.id)}
              />
            </div>

            <button onClick={() => setSelectedGroup(g)}>View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroupsPage;

// import React, { useState, useEffect } from "react";
// import "./GroupsPage.css";
// import GroupDetail from "./GroupDetail";
// import { Edit, Trash2 } from "lucide-react";
// import API from "../../services/api";

// function GroupsPage() {
//   const [groups, setGroups] = useState([]);
//   const [search, setSearch] = useState("");
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [showForm, setShowForm] = useState(false);
//   const [editingGroup, setEditingGroup] = useState(null);
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     cover: null,
//   });
//   const [preview, setPreview] = useState(null);
//   const [loading, setLoading] = useState(false);

  
//   useEffect(() => {
//     const fetchGroups = async () => {
//       try {
//         const res = await API.get("/groups");
//         if (res.data.status === "success") {
//           const mapped = res.data.data.map((g) => ({
//             id: g.id,
//             name: g.groupName,
//             description: g.description,
//             cover: g.groupImage,
//             createdAt: g.createdDate,
//             membersCount: g.membersCount || 0,
//           }));
//           setGroups(mapped);
//         }
//       } catch (err) {
//         console.error("Error fetching groups", err);
//       }
//     };
//     fetchGroups();
//   }, []);

//   const openCreateForm = () => {
//     setFormData({ name: "", description: "", cover: null });
//     setPreview(null);
//     setEditingGroup(null);
//     setShowForm(true);
//   };

//   const openEditForm = (group) => {
//     setFormData({ name: group.name, description: group.description, cover: null });
//     setPreview(group.cover || null);
//     setEditingGroup(group);
//     setShowForm(true);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const data = new FormData();
//       data.append("groupName", formData.name);
//       data.append("description", formData.description);

//       if (formData.cover) {
//         data.append("groupImage", formData.cover);
//       }

//       if (editingGroup) {
//         const res = await API.put(`/groups/${editingGroup.id}`, data, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         if (res.data.status === "success") {
//           const g = res.data.data[0];
//           const updatedGroup = {
//             id: g.id,
//             name: g.groupName,
//             description: g.description,
//             cover: g.groupImage || editingGroup.cover,
//             createdAt: g.createdDate,
//             membersCount: g.membersCount || editingGroup.membersCount || 0,

//           };
//           setGroups(groups.map((gr) => (gr.id === g.id ? updatedGroup : gr)));
//         }
//       } else {
//         const res = await API.post("/groups", data, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         if (res.data.status === "success") {
//           const g = res.data.data[0];
//           const newGroup = {
//             id: g.id,
//             name: g.groupName,
//             description: g.description,
//             cover: g.groupImage,
//             createdAt: g.createdDate,
//             membersCount: g.membersCount
//           };
//           setGroups([...groups, newGroup]);
//         }
//       }

//       setShowForm(false);
//       setEditingGroup(null);
//       setFormData({ name: "", description: "", cover: null });
//       setPreview(null);
//     } catch (err) {
//       console.error("Error saving group", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteGroup = async (id) => {
//     if (window.confirm("Are you sure you want to delete this group?")) {
//       try {
//         const res = await API.delete(`/groups/${id}`);
//         if (res.data.status === "success") {
//           setGroups(groups.filter((g) => g.id !== id));
//         }
//       } catch (err) {
//         console.error("Error deleting group", err);
//       }
//     }
//   };

//   const filteredGroups = groups.filter((g) =>
//     g.name.toLowerCase().includes(search.toLowerCase())
//   );

//   if (selectedGroup) {
//     return (
//       <GroupDetail
//         group={selectedGroup}
//         goBack={() => setSelectedGroup(null)}
//         updateGroup={(updatedGroup) => {
//           setGroups(groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
//           setSelectedGroup(updatedGroup);
//         }}
//       />
//     );
//   }

//   return (
//     <div className="container">
//       <h1 style={{ color: "#4f46e5" }}>Groups</h1>

//       <div className="controls">
//         <input
//           type="text"
//           placeholder="Search group"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//         <button onClick={openCreateForm}>Create Group</button>
//       </div>

//       {showForm && (
//         <form className="form-card" onSubmit={handleSubmit}>
//           <h3>{editingGroup ? "Edit Group" : "Create New Group"}</h3>

//           <input
//             type="text"
//             placeholder="Group Name"
//             value={formData.name}
//             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//             required
//           />

//           <textarea
//             placeholder="Description"
//             value={formData.description}
//             onChange={(e) =>
//               setFormData({ ...formData, description: e.target.value })
//             }
//           />

//           <input
//             type="file"
//             accept="image/*"
//             onChange={(e) => {
//               const file = e.target.files[0];
//               setFormData({ ...formData, cover: file });
//               setPreview(file ? URL.createObjectURL(file) : null);
//             }}
//           />

//           {preview && (
//             <img
//               src={preview}
//               alt="Preview"
//               style={{
//                 width: "100%",
//                 height: "150px",
//                 objectFit: "cover",
//                 marginTop: "10px",
//                 borderRadius: "8px",
//               }}
//             />
//           )}

//           <button type="submit" disabled={loading}>
//             {editingGroup ? "Update Group" : "Add Group"}
//           </button>
//         </form>
//       )}

//       <div className="groups-list">
//         {filteredGroups.map((g) => (
//           <div className="group-card" key={g.id} style={{ position: "relative" }}>
//             {g.cover ? (
//               <img src={g.cover} alt={g.name} className="cover-img" />
//             ) : (
//               <div style={{ height: "180px", background: "#ddd" }}></div>
//             )}

//             <div className="overlay">
//               <h2>{g.name}</h2>
//             </div>

//             <span className="badge">{g.membersCount} members</span>

//             <div
//               className="card-icons"
//               style={{
//                 position: "absolute",
//                 top: "8px",
//                 left: "8px",
//                 display: "flex",
//                 gap: "6px",
//               }}
//             >
//               <Edit
//                 size={18}
//                 style={{ cursor: "pointer", color: "#2563EB" }}
//                 onClick={() => openEditForm(g)}
//               />
//               <Trash2
//                 size={18}
//                 style={{ cursor: "pointer", color: "#DC2626" }}
//                 onClick={() => handleDeleteGroup(g.id)}
//               />
//             </div>

//             <button onClick={() => setSelectedGroup(g)}>View Details</button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default GroupsPage;
