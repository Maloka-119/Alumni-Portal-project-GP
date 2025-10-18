import React, { useState, useEffect } from "react";
import { Edit2, Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react";
import API from "../../services/api";
import "./FAQManage.css";

function FAQManage() {
  const [faqs, setFaqs] = useState([]);
  const [newFAQ, setNewFAQ] = useState({ question: "", answer: "" });
  const [editId, setEditId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await API.get("/admin/faqs");
      console.log("Raw API response:", res);
      const faqData = Array.isArray(res.data.data) ? res.data.data : [];
      setFaqs(faqData);
      console.log("FAQs state after setFaqs:", faqData);
    } catch (err) {
      console.error("Error loading FAQs:", err);
    }
  };

  const handleAdd = async () => {
    if (!newFAQ.question || !newFAQ.answer) return;

    try {
      if (editId) {
        await API.put(`/admin/faqs/${editId}`, newFAQ);
        console.log(`FAQ with id ${editId} updated`);
      } else {
        await API.post("/admin/faqs", newFAQ);
        console.log("New FAQ added");
      }

      setNewFAQ({ question: "", answer: "" });
      setEditId(null);
      setShowForm(false);
      await fetchFaqs();
    } catch (err) {
      console.error("Error saving FAQ:", err);
    }
  };

  const handleEdit = (faq) => {
    setNewFAQ({ question: faq.question, answer: faq.answer });
    setEditId(faq.faq_id); // استخدم faq_id
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    console.log(`Editing FAQ with id ${faq.faq_id}`);
  };

  const handleDelete = async (faq_id) => {
    try {
      await API.delete(`/admin/faqs/${faq_id}/hard`);
      console.log(`FAQ with id ${faq_id} deleted`);
      await fetchFaqs();
    } catch (err) {
      console.error("Error deleting FAQ:", err);
    }
  };

  const toggleOpen = (faq_id) => {
    setOpenId(openId === faq_id ? null : faq_id);
  };

  return (
    <div className="faq-manage">
      <div className="faq-header-top">
        <h1 className="page-title">FAQ Management</h1>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          {showForm ? "Close" : "Add Question"}
        </button>
      </div>

      {showForm && (
        <div className="faq-form">
          <input
            type="text"
            placeholder="Question"
            value={newFAQ.question}
            onChange={(e) =>
              setNewFAQ({ ...newFAQ, question: e.target.value })
            }
          />
          <textarea
            placeholder="Answer"
            value={newFAQ.answer}
            onChange={(e) =>
              setNewFAQ({ ...newFAQ, answer: e.target.value })
            }
          ></textarea>
          <button onClick={handleAdd}>
            {editId ? "Update FAQ" : "Save FAQ"}
          </button>
        </div>
      )}

      <div className="faq-list">
        {Array.isArray(faqs) && faqs.length > 0 ? (
          faqs.map((faq) => (
            <div
              key={faq.faq_id} // استخدم faq_id كـ key
              className={`faq-item ${openId === faq.faq_id ? "open" : ""}`}
            >
              <div className="faq-header">
                <h4>{faq.question}</h4>
                <div className="faq-icons">
                  <button onClick={() => handleEdit(faq)}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(faq.faq_id)}>
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => toggleOpen(faq.faq_id)}>
                    {openId === faq.faq_id ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className={`faq-answer ${openId === faq.faq_id ? "open" : ""}`}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No FAQs found</p>
        )}
      </div>
    </div>
  );
}

export default FAQManage;


// import React, { useState, useEffect } from "react";
// import { Edit2, Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react";
// import API from "../../services/api";
// import "./FAQManage.css";

// function FAQManage() {
//   const [faqs, setFaqs] = useState([]);
//   const [newFAQ, setNewFAQ] = useState({ question: "", answer: "" });
//   const [editId, setEditId] = useState(null);
//   const [openId, setOpenId] = useState(null);
//   const [showForm, setShowForm] = useState(false);

//   useEffect(() => {
//     fetchFaqs();
//   }, []);

//   const fetchFaqs = async () => {
//     try {
//       const res = await API.get("/admin/faqs");
//       setFaqs(res.data);
//     } catch (err) {
//       console.error("Error loading FAQs:", err);
//     }
//   };

//   const handleAdd = async () => {
//     if (!newFAQ.question || !newFAQ.answer) return;

//     try {
//       if (editId) {
//         await API.put(`/admin/faqs/${editId}`, newFAQ);
//       } else {
//         await API.post("/admin/faqs", newFAQ);
//       }

//       setNewFAQ({ question: "", answer: "" });
//       setEditId(null);
//       setShowForm(false);
//       fetchFaqs();
//     } catch (err) {
//       console.error("Error saving FAQ:", err);
//     }
//   };

//   const handleEdit = (faq) => {
//     setNewFAQ({ question: faq.question, answer: faq.answer });
//     setEditId(faq.id);
//     setShowForm(true);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const handleDelete = async (id) => {
//     try {
//       await API.delete(`/admin/faqs/${id}/hard`);
//       setFaqs(faqs.filter((f) => f.id !== id));
//     } catch (err) {
//       console.error("Error deleting FAQ:", err);
//     }
//   };

//   const toggleOpen = (id) => {
//     setOpenId(openId === id ? null : id);
//   };

//   return (
//     <div className="faq-manage">
//       <div className="faq-header-top">
//         <h1 className="page-title">FAQ Management</h1>
//         <button className="add-btn" onClick={() => setShowForm(!showForm)}>
//           <Plus size={18} />
//           {showForm ? "Close" : "Add Question"}
//         </button>
//       </div>

//       {showForm && (
//         <div className="faq-form">
//           <input
//             type="text"
//             placeholder="Question"
//             value={newFAQ.question}
//             onChange={(e) =>
//               setNewFAQ({ ...newFAQ, question: e.target.value })
//             }
//           />
//           <textarea
//             placeholder="Answer"
//             value={newFAQ.answer}
//             onChange={(e) =>
//               setNewFAQ({ ...newFAQ, answer: e.target.value })
//             }
//           ></textarea>
//           <button onClick={handleAdd}>
//             {editId ? "Update FAQ" : "Save FAQ"}
//           </button>
//         </div>
//       )}

//       <div className="faq-list">
//         {faqs.map((faq) => (
//           <div
//             key={faq.id}
//             className={`faq-item ${openId === faq.id ? "open" : ""}`}
//           >
//             <div className="faq-header">
//               <h4>{faq.question}</h4>
//               <div className="faq-icons">
//                 <button onClick={() => handleEdit(faq)}>
//                   <Edit2 size={16} />
//                 </button>
//                 <button onClick={() => handleDelete(faq.id)}>
//                   <Trash2 size={16} />
//                 </button>
//                 <button onClick={() => toggleOpen(faq.id)}>
//                   {openId === faq.id ? (
//                     <ChevronUp size={18} />
//                   ) : (
//                     <ChevronDown size={18} />
//                   )}
//                 </button>
//               </div>
//             </div>

//             <div className={`faq-answer ${openId === faq.id ? "open" : ""}`}>
//               <p>{faq.answer}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default FAQManage;
