

import React, { useState, useEffect, useRef, useContext } from "react";
import "./GroupsPage.css";
import GroupDetail from "./GroupDetail";
import { Edit, Trash2 } from "lucide-react";
import API from "../../services/api";
import imageCompression from "browser-image-compression";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import communityCover from "./defualtCommunityCover.jpg";
import { getPermission } from "../../components/usePermission";

function GroupsPage({ currentUser }) {
  const formRef = useRef(null);
  const { t, i18n } = useTranslation();
  const loggedInUserId = localStorage.getItem("userId");

  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const [formData, setFormData] = useState({ name: "", description: "", cover: null });

  const previewUrlRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");

  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}` };

  const isAdmin = currentUser?.userType === "admin";

  const comPerm = isAdmin
    ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
    : getPermission("Communities management", currentUser);

  const parentPerms = {
    canView: comPerm.canView,
    canAdd: comPerm.canAdd,
    canEdit: comPerm.canEdit,
    canDelete: comPerm.canDelete
  };

  const postPerms = isAdmin
    ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
    : getPermission("Community Post's management", currentUser);

  const memberPerms = isAdmin
    ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
    : getPermission("Community Members management", currentUser);

  const perms = {
    canView: postPerms.canView || memberPerms.canView,
    canAdd: postPerms.canAdd || memberPerms.canAdd,
    canEdit: postPerms.canEdit || memberPerms.canEdit,
    canDelete: postPerms.canDelete || memberPerms.canDelete
  };

  const lang = i18n.language;

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await API.get("/faculties");
        if (res.data.status === "success") {
          setFaculties(res.data.data);
        }
      } catch (err) {
        console.error("faculties fetch error", err);
      }
    };

    fetchFaculties();
  }, []);

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
          membersCount: g.membersCount || 0
        }));
        setGroups(mapped);
      }
    } catch (err) {
      console.error("groups fetch error", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const openCreateForm = () => {
    if (!parentPerms.canAdd) return;

    cleanupPreview();
    setFormData({ name: "", description: "", cover: null });
    setSelectedFaculty("");
    setEditingGroup(null);
    setShowForm(!showForm);
  };

  const openEditForm = (group) => {
    if (!parentPerms.canEdit) return;

    cleanupPreview();
    setFormData({ name: group.name || "", description: group.description || "", cover: null });
    if (group.cover) setPreview(group.cover);

    setEditingGroup(group);
    setShowForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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

    if (!parentPerms.canAdd && !editingGroup) return;
    if (!parentPerms.canEdit && editingGroup) return;

    setLoading(true);

    try {
      let res;

      if (formData.cover) {
        const data = new FormData();
        data.append("groupName", formData.name);
        data.append("description", formData.description);
        data.append("groupImage", formData.cover);

        res = editingGroup
          ? await API.put(`/groups/${editingGroup.id}`, data, { headers: authHeaders })
          : await API.post("/groups", data, { headers: authHeaders });
      } else {
        const payload = { groupName: formData.name, description: formData.description };

        res = editingGroup
          ? await API.put(`/groups/${editingGroup.id}`, payload, {
              headers: { ...authHeaders, "Content-Type": "application/json" }
            })
          : await API.post("/groups", payload, {
              headers: { ...authHeaders, "Content-Type": "application/json" }
            });
      }

      if (res.data.status === "success") {
        await fetchGroups();

        Swal.fire({
          icon: "success",
          title: editingGroup ? t("groupUpdated") : t("groupCreated"),
          showConfirmButton: false,
          timer: 1500
        });

        if (editingGroup) {
          setTimeout(() => {
            const card = document.getElementById(`group-${editingGroup.id}`);
            card?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      }

      cleanupPreview();
      setShowForm(false);
      setEditingGroup(null);
      setFormData({ name: "", description: "", cover: null });
      setSelectedFaculty("");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t("failedToSave"),
        text: err.response?.data?.message || ""
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!parentPerms.canDelete) return;

    const result = await Swal.fire({
      title: t("deleteConfirm"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("yesDelete"),
      cancelButtonText: t("cancel")
    });

    if (result.isConfirmed) {
      try {
        const res = await API.delete(`/groups/${id}`, { headers: authHeaders });

        if (res.data.status === "success") {
          await fetchGroups();

          Swal.fire({
            icon: "success",
            title: t("groupDeleted"),
            showConfirmButton: false,
            timer: 1500
          });
        }
      } catch {
        Swal.fire({ icon: "error", title: t("failedToDelete") });
      }
    }
  };

  const handleDeleteCover = async () => {
    if (!editingGroup) return;

    try {
      await API.put(`/groups/${editingGroup.id}`, { removeGroupImage: true }, { headers: authHeaders });
      setFormData({ ...formData, cover: null });
      cleanupPreview();

      Swal.fire({
        icon: "success",
        title: t("coverDeleted"),
        showConfirmButton: false,
        timer: 1200
      });
    } catch {
      Swal.fire({ icon: "error", title: t("failedToDelete") });
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
        updateGroup={(updated) => {
          setGroups(groups.map((g) => (g.id === updated.id ? updated : g)));
          setSelectedGroup(updated);
        }}
        perms={{ postPerms, memberPerms }}
        currentUserId={loggedInUserId}
      />
    );
  }

  return (
    <div className="grcontainer">
      <h1 style={{ color: "#4f46e5" }}>{t("communities")}</h1>

      <div className="controls">
        <input
          type="text"
          placeholder={t("searchCommunity")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {parentPerms.canAdd && (
          <button onClick={openCreateForm}>
            {showForm && !editingGroup ? t("cancel") : t("createCommunity")}
          </button>
        )}
      </div>

      {showForm && (
        <form ref={formRef} className="form-card" onSubmit={handleSubmit}>
          <h3 style={{ color: "GrayText" }}>
            {editingGroup ? t("editGroup") : t("createNewGroup")}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            
            <input
              type="text"
              placeholder={t("groupName")}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setSelectedFaculty("");
              }}
              required
            />

            <select
              value={selectedFaculty}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedFaculty(value);
                if (value) {
                  setFormData({ ...formData, name: value });
                }
              }}
            >
              <option value="">{t("selectFaculty")}</option>

              {faculties.map((f, i) => (
                <option key={i} value={f[lang === "ar" ? "ar" : "en"]}>
                  {f[lang === "ar" ? "ar" : "en"]}
                </option>
              ))}
            </select>
          </div>

          <textarea
            placeholder={t("description with related year")}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={async (e) => {
              cleanupPreview();

              const file = e.target.files[0];
              if (!file) return;

              const allowed = ["image/png", "image/jpeg", "image/jpg"];
              if (!allowed.includes(file.type)) {
                Swal.fire({ icon: "error", title: t("invalidImageType") });
                return;
              }

              if (file.size / 1024 / 1024 > 2) {
                Swal.fire({ icon: "error", title: t("fileTooLarge") });
                return;
              }

              try {
                const compressed = await imageCompression(file, {
                  maxSizeMB: 1,
                  maxWidthOrHeight: 1024,
                  useWebWorker: true
                });

                setFormData({ ...formData, cover: compressed });

                const url = URL.createObjectURL(compressed);
                setPreview(url);
                previewUrlRef.current = url;
              } catch {
                const url = URL.createObjectURL(file);
                setPreview(url);
                previewUrlRef.current = url;
                setFormData({ ...formData, cover: file });
              }
            }}
          />

          {(preview || (editingGroup && editingGroup.cover)) && (
            <div style={{ position: "relative", marginTop: "10px" }}>
              <img
                src={preview || editingGroup.cover || communityCover}
                alt="cover"
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "8px"
                }}
              />

              <Trash2
                size={20}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  cursor: "pointer",
                  color: "#DC2626"
                }}
                onClick={handleDeleteCover}
              />
            </div>
          )}

          <button type="submit" disabled={loading}>
            {editingGroup ? t("updateGroup") : t("addGroup")}
          </button>
        </form>
      )}

      <div className="groups-list">
        {filteredGroups.map((g) => (
          <div className="group-card"
               key={g.id}
               id={`group-${g.id}`}
               style={{ position: "relative" }}>

            <img src={g.cover || communityCover} alt={g.name} className="cover-img" />

            <div className="groverlay">
              <h2>{g.name}</h2>
              {g.description && <p className="group-desc">{g.description}</p>}
            </div>

            <span className="badge">
              {g.membersCount} {t("members")}
            </span>

            {(parentPerms.canEdit || parentPerms.canDelete) && (
              <div
                className="card-icons"
                style={{
                  position: "absolute",
                  top: "8px",
                  left: "8px",
                  display: "flex",
                  gap: "6px"
                }}
              >
                {parentPerms.canEdit && (
                  <Edit
                    size={18}
                    style={{ cursor: "pointer", color: "#2563EB" }}
                    onClick={() => openEditForm(g)}
                  />
                )}

                {parentPerms.canDelete && (
                  <Trash2
                    size={18}
                    style={{ cursor: "pointer", color: "#DC2626" }}
                    onClick={() => handleDeleteGroup(g.id)}
                  />
                )}
              </div>
            )}

            {(postPerms.canView || memberPerms.canView) && (
              <button onClick={() => setSelectedGroup(g)}>
                {t("viewDetails")}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroupsPage;



// import React, { useState, useEffect, useRef, useContext } from "react";
// import "./GroupsPage.css";
// import GroupDetail from "./GroupDetail";
// import { Edit, Trash2 } from "lucide-react";
// import API from "../../services/api";
// import imageCompression from "browser-image-compression";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import communityCover from "./defualtCommunityCover.jpg";
// import { getPermission } from "../../components/usePermission";

// function GroupsPage({ currentUser }) {
//   const formRef = useRef(null);
//   const { t } = useTranslation();
//   const loggedInUserId = localStorage.getItem("userId");
//   const [groups, setGroups] = useState([]);
//   const [search, setSearch] = useState("");
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [showForm, setShowForm] = useState(false);
//   const [editingGroup, setEditingGroup] = useState(null);
//   const [formData, setFormData] = useState({ name: "", description: "", cover: null });
//   const [preview, setPreview] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const previewUrlRef = useRef(null);
  

//   const token = localStorage.getItem("token");
//   const authHeaders = { Authorization: `Bearer ${token}` };

//   const isAdmin = currentUser?.userType === "admin";

// const comPerm = isAdmin
//   ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
//   : getPermission("Communities management", currentUser);

// const parentPerms = {
//   canView: comPerm.canView,
//   canAdd: comPerm.canAdd,
//   canEdit: comPerm.canEdit,
//   canDelete: comPerm.canDelete,
// };

// const postPerms = isAdmin
//   ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
//   : getPermission("Community Post's management", currentUser);

// const memberPerms = isAdmin
//   ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
//   : getPermission("Community Members management", currentUser);

// const perms = {
//   canView: postPerms.canView || memberPerms.canView,
//   canAdd: postPerms.canAdd || memberPerms.canAdd,
//   canEdit: postPerms.canEdit || memberPerms.canEdit,
//   canDelete: postPerms.canDelete || memberPerms.canDelete,
// };


//   const fetchGroups = async () => {
//     try {
//       const res = await API.get("/groups");
//       if (res.data.status === "success") {
//         const mapped = res.data.data.map((g) => ({
//           id: g.id,
//           name: g.groupName,
//           description: g.description,
//           cover: g.groupImage,
//           createdAt: g.createdDate,
//           membersCount: g.membersCount || 0,
//         }));
//         setGroups(mapped);
//       }
//     } catch (err) {
//       console.error("Error fetching groups", err);
//     }
//   };

//   useEffect(() => { fetchGroups(); }, []);

//   const openCreateForm = () => {
//     if (!parentPerms.canAdd) return;
//     cleanupPreview();
//     setFormData({ name: "", description: "", cover: null });
//     setEditingGroup(null);
//     setShowForm(!showForm);
//   };

//   const openEditForm = (group) => {
//     if (!parentPerms.canEdit) return;
//     cleanupPreview();
//     setFormData({ name: group.name || "", description: group.description || "", cover: null });
//     if (group.cover) setPreview(group.cover);
//     setEditingGroup(group);
//     setShowForm(true);
  
//     // scroll للفورم بعد فتحه
//     setTimeout(() => {
//       formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
//     }, 100);
//   };

//   const cleanupPreview = () => {
//     if (previewUrlRef.current) {
//       URL.revokeObjectURL(previewUrlRef.current);
//       previewUrlRef.current = null;
//     }
//     setPreview(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!parentPerms.canAdd && !editingGroup) return;
//     if (!parentPerms.canEdit && editingGroup) return;
  
//     setLoading(true);
//     try {
//       let res;
//       if (formData.cover) {
//         const data = new FormData();
//         data.append("groupName", formData.name);
//         data.append("description", formData.description);
//         data.append("groupImage", formData.cover);
  
//         res = editingGroup
//           ? await API.put(`/groups/${editingGroup.id}`, data, { headers: authHeaders })
//           : await API.post("/groups", data, { headers: authHeaders });
//       } else {
//         const payload = { groupName: formData.name, description: formData.description };
//         res = editingGroup
//           ? await API.put(`/groups/${editingGroup.id}`, payload, { headers: { ...authHeaders, "Content-Type": "application/json" } })
//           : await API.post("/groups", payload, { headers: { ...authHeaders, "Content-Type": "application/json" } });
//       }
  
//       if (res.data.status === "success") {
//         await fetchGroups();
//         Swal.fire({ icon: "success", title: editingGroup ? t("groupUpdated") : t("groupCreated"), showConfirmButton: false, timer: 1500 });
  
//         // scroll للجروب اللي تم تعديله
//         if (editingGroup) {
//           setTimeout(() => {
//             const groupCard = document.getElementById(`group-${editingGroup.id}`);
//             groupCard?.scrollIntoView({ behavior: "smooth", block: "start" });
//           }, 100);
//         }
//       }
  
//       cleanupPreview();
//       setShowForm(false);
//       setEditingGroup(null);
//       setFormData({ name: "", description: "", cover: null });
//     } catch (err) {
//       console.error("Error saving group", err.response || err);
//       Swal.fire({ icon: "error", title: t("failedToSave"), text: err.response?.data?.message || "" });
//     } finally {
//       setLoading(false);
//     }
//   };
  

//   const handleDeleteGroup = async (id) => {
//     if (!parentPerms.canDelete) return;
//     const result = await Swal.fire({
//       title: t("deleteConfirm"),
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#dc2626",
//       cancelButtonColor: "#3085d6",
//       confirmButtonText: t("yesDelete"),
//       cancelButtonText: t("cancel"),
//     });

//     if (result.isConfirmed) {
//       try {
//         const res = await API.delete(`/groups/${id}`, { headers: authHeaders });
//         if (res.data.status === "success") {
//           await fetchGroups();
//           Swal.fire({ icon: "success", title: t("groupDeleted"), showConfirmButton: false, timer: 1500 });
//         }
//       } catch (err) {
//         console.error("Error deleting group", err);
//         Swal.fire({ icon: "error", title: t("failedToDelete") });
//       }
//     }
//   };

//   const handleDeleteCover = async () => {
//     if (!editingGroup) return;
//     try {
//       await API.put(`/groups/${editingGroup.id}`, { removeGroupImage: true }, { headers: authHeaders });
//       setFormData({ ...formData, cover: null });
//       cleanupPreview();
//       Swal.fire({ icon: "success", title: t("coverDeleted"), showConfirmButton: false, timer: 1200 });
//     } catch (err) {
//       Swal.fire({ icon: "error", title: t("failedToDelete") });
//       console.error(err);
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
//         perms={{ postPerms, memberPerms }}
//         currentUserId={loggedInUserId} 
//       />
//     );
//   }

//   return (
//     <div className="grcontainer">
//       <h1 style={{ color: "#4f46e5" }}>{t("communities")}</h1>
//       <div className="controls">
//         <input
//           type="text"
//           placeholder={t("searchCommunity")}
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//         {parentPerms.canAdd && (
//           <button onClick={openCreateForm}>
//             {showForm && !editingGroup ? t("cancel") : t("createCommunity")}
//           </button>
//         )}
//       </div>

//       {showForm && (parentPerms.canAdd || parentPerms.canEdit) && (
//        <form ref={formRef} className="form-card" onSubmit={handleSubmit}>
//           <h3 style={{ color: "GrayText" }}>
//             {editingGroup ? t("editGroup") : t("createNewGroup")}
//           </h3>
//           <input
//             type="text"
//             placeholder={t("groupName")}
//             value={formData.name}
//             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//             required
//           />
//           <textarea
//             placeholder={t("description")}
//             value={formData.description}
//             onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//           />
//           <input
//             type="file"
//             accept="image/png, image/jpeg, image/jpg"
//             onChange={async (e) => {
//               cleanupPreview();
//               const file = e.target.files[0];
//               if (!file) return;

//               const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
//               const maxSizeMB = 2;

//               if (!allowedTypes.includes(file.type)) {
//                 Swal.fire({ icon: "error", title: t("invalidImageType") });
//                 return;
//               }

//               if (file.size / 1024 / 1024 > maxSizeMB) {
//                 Swal.fire({ icon: "error", title: t("fileTooLarge") });
//                 return;
//               }

//               try {
//                 const compressedFile = await imageCompression(file, {
//                   maxSizeMB: 1,
//                   maxWidthOrHeight: 1024,
//                   useWebWorker: true,
//                 });
//                 setFormData({ ...formData, cover: compressedFile });
//                 const url = URL.createObjectURL(compressedFile);
//                 setPreview(url);
//                 previewUrlRef.current = url;
//               } catch {
//                 setFormData({ ...formData, cover: file });
//                 const url = URL.createObjectURL(file);
//                 setPreview(url);
//                 previewUrlRef.current = url;
//               }
//             }}
//           />
//           {(preview || (editingGroup && editingGroup.cover)) && (
//             <div style={{ position: "relative", marginTop: "10px" }}>
//               <img
//                 src={preview || editingGroup.cover || communityCover}
//                 alt="Cover"
//                 style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px" }}
//               />
//               <Trash2
//                 size={20}
//                 style={{ position: "absolute", top: "8px", right: "8px", cursor: "pointer", color: "#DC2626" }}
//                 title={t("deleteCover")}
//                 onClick={handleDeleteCover}
//               />
//             </div>
//           )}
//           <button type="submit" disabled={loading}>
//             {editingGroup ? t("updateGroup") : t("addGroup")}
//           </button>
//         </form>
//       )}

//       <div className="groups-list">
//         {filteredGroups.map((g) => (
//           <div className="group-card" key={g.id} id={`group-${g.id}`} style={{ position: "relative" }}>
//             <img src={g.cover || communityCover} alt={g.name} className="cover-img" />
//             <div className="groverlay"><h2>{g.name}</h2></div>
//             <span className="badge">{g.membersCount} {t("members")}</span>
//             {parentPerms.canEdit || parentPerms.canDelete ? (
//               <div className="card-icons" style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "6px" }}>
//                 {parentPerms.canEdit &&  <Edit size={18} style={{ cursor: "pointer", color: "#2563EB" }} onClick={() => openEditForm(g)} />}
//                 {parentPerms.canDelete && <Trash2 size={18} style={{ cursor: "pointer", color: "#DC2626" }} onClick={() => handleDeleteGroup(g.id)} />}
//               </div>
//             ) : null}
//             {(getPermission("Community Post's management", currentUser).canView ||
//               getPermission("Community Members management", currentUser).canView) && (
//               <button onClick={() => setSelectedGroup(g)}>
//                 {t("viewDetails")}
//               </button>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default GroupsPage;