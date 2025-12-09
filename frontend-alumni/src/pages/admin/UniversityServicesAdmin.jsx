import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { getPermission } from "../../components/usePermission";
import "./UniversityServicesAdmin.css"; 
import { Edit2, Trash2, ChevronDown, ChevronUp, Plus ,X ,Info} from "lucide-react";

const UniversityServicesAdmin = ({ currentUser }) => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ title: "", pref: "", details: "" });
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const perm = currentUser?.userType === "admin"
    ? { canView: true, canAdd: true, canEdit: true, canDelete: true }
    : getPermission("consultationManagement", currentUser) || { canView: false, canAdd: false, canEdit: false, canDelete: false };

  useEffect(() => {
    if (perm.canView) fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await API.get("/university-services");
      console.log("GET services response:", res);
      
      // الوصول للبيانات الحقيقية من داخل res.data.data
      const data = res.data.data;
      if (res.data.success) setServices(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingId) {
        res = await API.put(`/university-services/${editingId}`, form);
        console.log("UPDATE service response:", res);
      } else {
        res = await API.post("/university-services", form);
        console.log("CREATE service response:", res);
      }

      if (res.data.success) {
        Swal.fire(
          editingId ? t("Updated!") : t("Added!"),
          editingId ? t("Service updated successfully") : t("Service added successfully"),
          "success"
        );
        setEditingId(null);
        setForm({ title: "", pref: "", details: "" });
        setFormOpen(false);
        fetchServices();
      }
    } catch (error) {
      console.log("SUBMIT service error:", error);
      Swal.fire(t("Error!"), t("Something went wrong"), "error");
    }
  };

  const handleEdit = (service) => {
    setForm({ title: service.title, pref: service.pref, details: service.details });
    setEditingId(service.id);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: t("Are you sure?"),
      text: t("You won't be able to revert this!"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Yes, delete it!"),
      cancelButtonText: t("Cancel"),
    });

    if (result.isConfirmed) {
      try {
        const res = await API.delete(`/university-services/${id}`);
        console.log("DELETE service response:", res);

        if (res.data.success) {
          Swal.fire(t("Deleted!"), t("Service has been deleted."), "success");
          fetchServices();
        }
      } catch (error) {
        console.log("DELETE service error:", error);
        Swal.fire(t("Error!"), t("Something went wrong"), "error");
      }
    }
  };

  const [modalService, setModalService] = useState(null);

  const handleViewDetails = (service) => {
    setModalService(service);
    const formattedDetails = service.details.replace(/\n/g, "<br/>"); // تحويل السطور
    Swal.fire({
      title: service.title,
      html: `<p style="text-align: right;">${formattedDetails}</p>`,
      width: 600,
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonText: t("Close"),
    });
  };
  


  return (
    <div className="usp-manage">
      <div className="usp-header">
        <h2 className="page-title">{t("University Services")}</h2>
        {perm.canAdd && (
          <button className="add-btn" onClick={() => setFormOpen(!formOpen)}>
          {formOpen ? <X size={18} /> : <Plus size={18} />}
          <span>{formOpen ? t("close") : t("Add Service")}</span>
        </button>
        )}
      </div>

      {formOpen && (
        <form className="usp-form" onSubmit={handleSubmit}>
          <input name="title" value={form.title} onChange={handleChange} placeholder={t("Title")} required />
          <input name="pref" value={form.pref} onChange={handleChange} placeholder={t("Pref")} required />
          <textarea name="details" value={form.details} onChange={handleChange} placeholder={t("Details")} required />
          <button type="submit">{editingId ? t("Update") : t("Add")}</button>
        </form>
      )}

{perm.canView && (
  <div className="usp-list">
    {services.map((s) => (
      <div className="usp-item" key={s.id}>
        <div className="usp-header-item">
          <h4>{s.title}</h4>
          <div className="usp-actions">
            {perm.canEdit && <button onClick={() => handleEdit(s)}><Edit2 size={16} /></button>}
            {perm.canDelete && <button onClick={() => handleDelete(s.id)}><Trash2 size={16} color="red"/></button>}
            <button onClick={() => handleViewDetails(s)} ><Info size={16} /></button>
          </div>
        </div>
      </div>
    ))}
  </div>
)}

    </div>
  );
};

export default UniversityServicesAdmin;
