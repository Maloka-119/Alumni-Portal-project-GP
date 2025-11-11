// import React, { useState, useEffect } from "react";
// import { Edit2, Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react";
// import API from "../../services/api";
// import "./FAQManage.css";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";


// function FAQManage() {
//   const [faqs, setFaqs] = useState([]);
//   const [newFAQ, setNewFAQ] = useState({ question: "", answer: "" });
//   const [editId, setEditId] = useState(null);
//   const [openId, setOpenId] = useState(null);
//   const [showForm, setShowForm] = useState(false);
//   const { t } = useTranslation();


//   useEffect(() => {
//     fetchFaqs();
//   }, []);

//   const fetchFaqs = async () => {
//     try {
//       const res = await API.get("/admin/faqs");
//       console.log("Raw API response:", res);
//       const faqData = Array.isArray(res.data.data) ? res.data.data : [];
//       setFaqs(faqData);
//       console.log("FAQs state after setFaqs:", faqData);
//     } catch (err) {
//       console.error("Error loading FAQs:", err);
//     }
//   };
// const handleAdd = async () => {
//   if (!newFAQ.question || !newFAQ.answer) {
//     Swal.fire({
//       icon: "warning",
//       title: "Warning",
//       text: "Please fill in both question and answer!",
//     });
//     return;
//   }

//   try {
//     if (editId) {
//       await API.put(`/admin/faqs/${editId}`, newFAQ);
//       Swal.fire({
//         icon: "success",
//         title: "Updated",
//         text: `FAQ updated successfully`,
//       });
//     } else {
//       await API.post("/admin/faqs", newFAQ);
//       Swal.fire({
//         icon: "success",
//         title: "Added",
//         text: "New FAQ added successfully",
//       });
//     }

//     setNewFAQ({ question: "", answer: "" });
//     setEditId(null);
//     setShowForm(false);
//     await fetchFaqs();
//   } catch (err) {
//     console.error("Error saving FAQ:", err);
//     Swal.fire({
//       icon: "error",
//       title: "Error",
//       text: "An error occurred while saving the FAQ",
//     });
//   }
// };

// const handleEdit = (faq) => {
//   setNewFAQ({ question: faq.question, answer: faq.answer });
//   setEditId(faq.faq_id);
//   setShowForm(true);
//   window.scrollTo({ top: 0, behavior: "smooth" });

// };

// const handleDelete = async (faq_id) => {
//   const result = await Swal.fire({
//     title: "Are you sure?",
//     text: "You won't be able to revert this!",
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonText: "Yes, delete it!",
//     cancelButtonText: "Cancel",
//   });

//   if (result.isConfirmed) {
//     try {
//       await API.delete(`/admin/faqs/${faq_id}/hard`);
//       Swal.fire({
//         icon: "success",
//         title: "Deleted",
//         text: "FAQ deleted successfully",
//       });
//       await fetchFaqs();
//     } catch (err) {
//       console.error("Error deleting FAQ:", err);
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: "An error occurred while deleting the FAQ",
//       });
//     }
//   }
// };

//   const toggleOpen = (faq_id) => {
//     setOpenId(openId === faq_id ? null : faq_id);
//   };

//   return (
//     <div className="faq-manage">
//       <div className="faq-header-top">
//         <h1 className="page-title">{t("faqManagement")}</h1>
//         <button className="add-btn" onClick={() => setShowForm(!showForm)}>
//           <Plus size={18} />
//           {showForm ? t("close") : t("addQuestion")}
//         </button>
//       </div>

//       {showForm && (
//         <div className="faq-form">
//           <input
//             type="text"
//             placeholder={t("question")}
//             value={newFAQ.question}
//             onChange={(e) =>
//               setNewFAQ({ ...newFAQ, question: e.target.value })
//             }
//           />
//           <textarea
//             placeholder={t("answer")}
//             value={newFAQ.answer}
//             onChange={(e) =>
//               setNewFAQ({ ...newFAQ, answer: e.target.value })
//             }
//           ></textarea>
//           <button onClick={handleAdd}>
//           {editId ? t("updateFAQ") : t("saveFAQ")}
//           </button>
//         </div>
//       )}

//       <div className="faq-list">
//         {Array.isArray(faqs) && faqs.length > 0 ? (
//           faqs.map((faq) => (
//             <div
//               key={faq.faq_id} // استخدم faq_id كـ key
//               className={`faq-item ${openId === faq.faq_id ? "open" : ""}`}
//             >
//               <div className="faq-header">
//                 <h4>{faq.question}</h4>
//                 <div className="faq-icons">
//                   <button onClick={() => handleEdit(faq)}>
//                     <Edit2 size={16} />
//                   </button>
//                   <button onClick={() => handleDelete(faq.faq_id)}>
//                     <Trash2 size={16} />
//                   </button>
//                   <button onClick={() => toggleOpen(faq.faq_id)}>
//                     {openId === faq.faq_id ? (
//                       <ChevronUp size={18} />
//                     ) : (
//                       <ChevronDown size={18} />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               <div className={`faq-answer ${openId === faq.faq_id ? "open" : ""}`}>
//                 <p>{faq.answer}</p>
//               </div>
//             </div>
//           ))
//         ) : (
//           <p>{t("noFaqsFound")}</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default FAQManage;


import React, { useState, useEffect } from "react";
import { Edit2, Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react";
import API from "../../services/api";
import "./FAQManage.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { getPermission } from "../../components/usePermission";

function FAQManage({ currentUser }) {
  const [faqs, setFaqs] = useState([]);
  const [newFAQ, setNewFAQ] = useState({ question: "", answer: "" });
  const [editId, setEditId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { t } = useTranslation();

  const faqPerm = getPermission("FAQ management", currentUser);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await API.get("/admin/faqs");
      const faqData = Array.isArray(res.data.data) ? res.data.data : [];
      setFaqs(faqData);
    } catch (err) {
      console.error("Error loading FAQs:", err);
    }
  };

  const handleAdd = async () => {
    if (!faqPerm.canAdd && !editId) return;
    if (!newFAQ.question || !newFAQ.answer) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please fill in both question and answer!",
      });
      return;
    }

    try {
      if (editId && faqPerm.canEdit) {
        await API.put(`/admin/faqs/${editId}`, newFAQ);
        Swal.fire({ icon: "success", title: "Updated", text: "FAQ updated successfully" });
      } else if (!editId && faqPerm.canAdd) {
        await API.post("/admin/faqs", newFAQ);
        Swal.fire({ icon: "success", title: "Added", text: "New FAQ added successfully" });
      } else {
        Swal.fire({ icon: "error", title: "Permission Denied", text: "You cannot perform this action" });
        return;
      }

      setNewFAQ({ question: "", answer: "" });
      setEditId(null);
      setShowForm(false);
      await fetchFaqs();
    } catch (err) {
      console.error("Error saving FAQ:", err);
      Swal.fire({ icon: "error", title: "Error", text: "An error occurred while saving the FAQ" });
    }
  };

  const handleEdit = (faq) => {
    if (!faqPerm.canEdit) return;
    setNewFAQ({ question: faq.question, answer: faq.answer });
    setEditId(faq.faq_id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (faq_id) => {
    if (!faqPerm.canDelete) return;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await API.delete(`/admin/faqs/${faq_id}/hard`);
        Swal.fire({ icon: "success", title: "Deleted", text: "FAQ deleted successfully" });
        await fetchFaqs();
      } catch (err) {
        console.error("Error deleting FAQ:", err);
        Swal.fire({ icon: "error", title: "Error", text: "An error occurred while deleting the FAQ" });
      }
    }
  };

  const toggleOpen = (faq_id) => setOpenId(openId === faq_id ? null : faq_id);

  return (
    <div className="faq-manage">
      <div className="faq-header-top">
        <h1 className="page-title">{t("faqManagement")}</h1>
        {faqPerm.canAdd && (
          <button className="add-btn" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} />
            {showForm ? t("close") : t("addQuestion")}
          </button>
        )}
      </div>

      {showForm && faqPerm.canAdd && (
        <div className="faq-form">
          <input
            type="text"
            placeholder={t("question")}
            value={newFAQ.question}
            onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
          />
          <textarea
            placeholder={t("answer")}
            value={newFAQ.answer}
            onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
          ></textarea>
          <button onClick={handleAdd}>{editId ? t("updateFAQ") : t("saveFAQ")}</button>
        </div>
      )}

      <div className="faq-list">
        {Array.isArray(faqs) && faqs.length > 0 ? (
          faqs.map((faq) => (
            <div key={faq.faq_id} className={`faq-item ${openId === faq.faq_id ? "open" : ""}`}>
              <div className="faq-header">
                <h4>{faq.question}</h4>
                <div className="faq-icons">
                  {faqPerm.canEdit && <button onClick={() => handleEdit(faq)}><Edit2 size={16} /></button>}
                  {faqPerm.canDelete && <button onClick={() => handleDelete(faq.faq_id)}><Trash2 size={16} /></button>}
                  <button onClick={() => toggleOpen(faq.faq_id)}>
                    {openId === faq.faq_id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>
              <div className={`faq-answer ${openId === faq.faq_id ? "open" : ""}`}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))
        ) : (
          <p>{t("noFaqsFound")}</p>
        )}
      </div>
    </div>
  );
}

export default FAQManage;
