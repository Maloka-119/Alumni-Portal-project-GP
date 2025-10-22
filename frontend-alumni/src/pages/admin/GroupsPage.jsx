import React, { useState, useEffect, useRef } from "react";
import "./GroupsPage.css";
import GroupDetail from "./GroupDetail";
import { Edit, Trash2 } from "lucide-react";
import API from "../../services/api";
import imageCompression from "browser-image-compression";
import { useTranslation } from "react-i18next";

function GroupsPage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", cover: null });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const previewUrlRef = useRef(null);

  const token = localStorage.getItem("token");
  const authHeaders = { Authorization: `Bearer ${token}` };

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

  useEffect(() => {
    fetchGroups();
  }, []);

  const openCreateForm = () => {
    if (showForm && !editingGroup) {
      setShowForm(false);
      cleanupPreview();
      setFormData({ name: "", description: "", cover: null });
      return;
    }
    cleanupPreview();
    setFormData({ name: "", description: "", cover: null });
    setEditingGroup(null);
    setShowForm(true);
  };

  const openEditForm = (group) => {
    cleanupPreview();
    setFormData({
      name: group.name || "",
      description: group.description || "",
      cover: null,
    });
    if (group.cover) setPreview(group.cover);
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
              headers: { ...authHeaders, "Content-Type": "application/json" },
            })
          : await API.post("/groups", payload, {
              headers: { ...authHeaders, "Content-Type": "application/json" },
            });
      }

      if (res.data.status === "success") {
        await fetchGroups();
        alert(editingGroup ? t("groupUpdated") : t("groupCreated"));
      }

      cleanupPreview();
      setShowForm(false);
      setEditingGroup(null);
      setFormData({ name: "", description: "", cover: null });
    } catch (err) {
      console.error("Error saving group", err.response || err);
      alert(t("failedToSave"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (window.confirm(t("deleteConfirm"))) {
      try {
        const res = await API.delete(`/groups/${id}`, { headers: authHeaders });
        if (res.data.status === "success") {
          await fetchGroups();
          alert(t("groupDeleted"));
        }
      } catch (err) {
        console.error("Error deleting group", err);
        alert(t("failedToDelete"));
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
    <div className="grcontainer">
      <h1 style={{ color: "#4f46e5" }}>{t("communities")}</h1>

      <div className="controls">
        <input
          type="text"
          placeholder={t("searchCommunity")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={openCreateForm}>
          {showForm && !editingGroup ? t("cancel") : t("createCommunity")}
        </button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3 style={{ color: "GrayText" }}>
            {editingGroup ? t("editGroup") : t("createNewGroup")}
          </h3>

          <input
            type="text"
            placeholder={t("groupName")}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <textarea
            placeholder={t("description")}
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

              const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
              if (!allowedTypes.includes(file.type)) {
                alert(t("invalidImageType"));
                return;
              }

              const maxSizeMB = 2;
              if (file.size / 1024 / 1024 > maxSizeMB) {
                alert(t("fileTooLarge"));
                return;
              }

              try {
                const compressedFile = await imageCompression(file, {
                  maxSizeMB: 1,
                  maxWidthOrHeight: 1024,
                  useWebWorker: true,
                });

                setFormData({ ...formData, cover: compressedFile });
                const url = URL.createObjectURL(compressedFile);
                setPreview(url);
                previewUrlRef.current = url;
              } catch (err) {
                console.error("Error compressing image", err);
                setFormData({ ...formData, cover: file });
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
            {editingGroup ? t("updateGroup") : t("addGroup")}
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

            <div className="groverlay">
              <h2>{g.name}</h2>
            </div>

            <span className="badge">{g.membersCount} {t("members")}</span>

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

            <button onClick={() => setSelectedGroup(g)}>{t("viewDetails")}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroupsPage;

