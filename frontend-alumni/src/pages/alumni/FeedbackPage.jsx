
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import "./FeedbackPage.css";

export default function FeedbackPageUnique() {
  const { t, i18n } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [records, setRecords] = useState([]);
  const [modalItem, setModalItem] = useState(null);

  const [type, setType] = useState("complaint");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await API.get("/feedbacks"); 
        setRecords(response.data);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      }
    };
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newItem = {
      type,
      title,
      details,
      phone,
      email,
    };

    try {
      const response = await API.post("/feedbacks", newItem); 
      setRecords([response.data, ...records]);
      setTitle("");
      setDetails("");
      setPhone("");
      setEmail("");
      setType("complaint");
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const smallText = (text) => {
    if (text.length <= 60) return text;
    return text.slice(0, 60) + "...";
  };

  return (
    <div
      className="feedback-main-container"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <h2 className="uni-header">{t("feedbackPageTitle")}</h2>
      <p className="feedback-description">{t("feedbackPageDescription")}</p>

      <button
        className="feedback-toggle-btn"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? t("close") : t("addFeedback")}
      </button>

      {showForm && (
        <form className="feedback-form-box" onSubmit={handleSubmit}>
          <label>
            {t("category")}
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="complaint">{t("complaint")}</option>
              <option value="suggestion">{t("suggestion")}</option>
            </select>
          </label>

          <label>
            {t("title")}
            <input
              type="text"
              value={title}
              required
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label>
            {t("details")}
            <textarea
              value={details}
              required
              onChange={(e) => setDetails(e.target.value)}
            />
          </label>

          <label>
            {t("phone")}
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label>
            {t("email")}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <button className="feedback-submit-btn" type="submit">
            {t("submit")}
          </button>
        </form>
      )}

      <div className="feedback-cards-wrapper">
        {records.map((item) => (
          <div key={item.id} className="feedback-card">
            <span className="feedback-badge">#{item.id}</span>
            <h4 className="feedback-card-title">{item.title}</h4>
            <p className="feedback-card-text">{smallText(item.details)}</p>
            <button
              className="feedback-see-more"
              onClick={() => setModalItem(item)}
            >
              {t("seeMore")}
            </button>
          </div>
        ))}
      </div>

      {modalItem && (
        <div className="feedback-modal-overlay">
          <div className="feedback-modal-box">
            <h3 className="modal-title">{modalItem.title}</h3>
            <p className="modal-details">{modalItem.details}</p>
            <p className="modal-info">{modalItem.phone || "-"}</p>
            <p className="modal-info">{modalItem.email || "-"}</p>
            <button
              className="modal-close-btn"
              onClick={() => setModalItem(null)}
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// import React, { useState } from "react";
// import { useTranslation } from "react-i18next";
// import "./FeedbackPage.css";

// export default function FeedbackPageUnique() {
//   const { t, i18n } = useTranslation();
//   const [showForm, setShowForm] = useState(false);
//   const [records, setRecords] = useState([]);
//   const [modalItem, setModalItem] = useState(null);

//   const [type, setType] = useState("complaint");
//   const [title, setTitle] = useState("");
//   const [details, setDetails] = useState("");
//   const [phone, setPhone] = useState("");
//   const [email, setEmail] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     const newItem = {
//       id: records.length + 1,
//       type,
//       title,
//       details,
//       phone,
//       email,
//     };

//     setRecords([newItem, ...records]);

//     setTitle("");
//     setDetails("");
//     setPhone("");
//     setEmail("");
//     setType("complaint");
//     setShowForm(false);
//   };

//   const smallText = (text) => {
//     if (text.length <= 60) return text;
//     return text.slice(0, 60) + "...";
//   };

//   return (
//     <div
//       className="feedback-main-container"
//       dir={i18n.language === "ar" ? "rtl" : "ltr"}
//     >
//       <h2 className="uni-header">{t("feedbackPageTitle")}</h2>

//       <p className="feedback-description">
//         {t("feedbackPageDescription")}
//       </p>

//       <button
//         className="feedback-toggle-btn"
//         onClick={() => setShowForm(!showForm)}
//       >
//         {showForm ? t("close") : t("addFeedback")}
//       </button>

//       {showForm && (
//         <form className="feedback-form-box" onSubmit={handleSubmit}>
//           <label>
//             {t("category")}
//             <select value={type} onChange={(e) => setType(e.target.value)}>
//               <option value="complaint">{t("complaint")}</option>
//               <option value="suggestion">{t("suggestion")}</option>
//             </select>
//           </label>

//           <label>
//             {t("title")}
//             <input
//               type="text"
//               value={title}
//               required
//               onChange={(e) => setTitle(e.target.value)}
//             />
//           </label>

//           <label>
//             {t("details")}
//             <textarea
//               value={details}
//               required
//               onChange={(e) => setDetails(e.target.value)}
//             />
//           </label>

//           <label>
//             {t("phone")}
//             <input
//               type="text"
//               value={phone}
//               onChange={(e) => setPhone(e.target.value)}
//             />
//           </label>

//           <label>
//             {t("email")}
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//           </label>

//           <button className="feedback-submit-btn" type="submit">
//             {t("submit")}
//           </button>
//         </form>
//       )}

//       <div className="feedback-cards-wrapper">
//         {records.map((item) => (
//           <div
//             key={item.id}
//             className="feedback-card"
//           >
//             <span className="feedback-badge">#{item.id}</span>

//             <h4 className="feedback-card-title">{item.title}</h4>

//             <p className="feedback-card-text">
//               {smallText(item.details)}
//             </p>

//             <button
//               className="feedback-see-more"
//               onClick={() => setModalItem(item)}
//             >
//               {t("seeMore")}
//             </button>
//           </div>
//         ))}
//       </div>

//       {modalItem && (
//         <div className="feedback-modal-overlay">
//           <div className="feedback-modal-box">
//             <h3 className="modal-title">{modalItem.title}</h3>

//             <p className="modal-details">{modalItem.details}</p>

//             <p className="modal-info">
//                {modalItem.phone || "-"}
//             </p>

//             <p className="modal-info">
//                {modalItem.email || "-"}
//             </p>

//             <button
//               className="modal-close-btn"
//               onClick={() => setModalItem(null)}
//             >
//               {t("close")}
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

