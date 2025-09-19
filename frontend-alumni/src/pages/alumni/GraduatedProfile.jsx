import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./GradProfile.css";
import PROFILE from "./PROFILE.jpeg";
import API from "../../services/api";

function GraduatedProfile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const { t } = useTranslation();

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  useEffect(() => {
    console.log("userId passed to GraduatedProfile:", userId);
    if (userId) fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const res = await API.get(`/graduates/${userId}/profile`);
      const data = res.data.data;

      // لو fullName موجود والاسم الأول والآخر فاضي
      if (data.fullName && (!data.firstName || !data.lastName)) {
        const parts = data.fullName.split(" ");
        data.firstName = parts[0] || "";
        data.lastName = parts.slice(1).join(" ") || "";
      }

      // تحويل skills من string JSON لمصفوفة لو محتاجة
      if (typeof data.skills === "string") {
        try {
          data.skills = JSON.parse(data.skills);
        } catch {
          data.skills = [];
        }
      }

      setUser(data);
      setFormData(data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSkillsChange = (e) => {
    setFormData({ ...formData, skills: e.target.value.split(",") });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilePictureFile: file });
      console.log("Selected profile picture:", file);
    }
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, cvFile: file });
      console.log("Selected CV file:", file);
    }
  };

  const handleEdit = () => {
    if (user.fullName) {
      const parts = user.fullName.split(" ");
      setFormData({
        ...user,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
      });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = new FormData();

      // البيانات النصية
      payload.append("firstName", formData.firstName);
      payload.append("lastName", formData.lastName);
      payload.append("bio", formData.bio || "");
      payload.append("currentJob", formData.currentJob || "");
      payload.append("skills", JSON.stringify(formData.skills || []));
      payload.append("faculty", formData.faculty || "");
      payload.append("graduationYear", formData.graduationYear || "");
      payload.append("linkedInLink", formData.linkedInLink || "");
    payload.append("phoneNumber", formData.phoneNumber || "");

      // الملفات
      if (formData.profilePictureFile)
        payload.append("profilePicture", formData.profilePictureFile);
      if (formData.cvFile) payload.append("cv", formData.cvFile);

      // تأكيد كل البيانات قبل الإرسال
      for (let pair of payload.entries()) {
        console.log(pair[0], pair[1]);
      }

      const res = await API.put("/graduates/profile", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Update response:", res.data);
      await fetchUser(); // تحديث البيانات بعد الحفظ
      setEditing(false);
    } catch (err) {
      console.error("Failed to update user:", err.response?.data || err.message);
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setEditing(false);
  };

  if (!user || !formData) return <p>{t("loading")}</p>;

  const fullName =
    formData.fullName || `${formData.firstName || ""} ${formData.lastName || ""}`;

  return (
    <div>
      <h1>{t("profile")}</h1>

      {!editing ? (
        <div className="profile-card">
          <img
            src={formData.profilePicture || PROFILE}
            alt="Profile"
            className="profile-img"
          />
          <h2>{fullName}</h2>
          <p>
            <strong>{t("faculty")}:</strong> {formData.faculty}
          </p>
          <p>
            <strong>{t("graduationYear")}:</strong> {formData.graduationYear}
          </p>
          <p>
            <strong>{t("bio")}:</strong> {formData.bio}
          </p>
          <p>
            <strong>{t("cv")}:</strong>{" "}
            {formData.CV ? (
              <a href={formData.CV} download>
                {t("downloadCv")}
              </a>
            ) : (
              t("noCv")
            )}
          </p>
          <p>
            <strong>{t("skills")}:</strong>{" "}
            {formData.skills && formData.skills.length > 0
              ? formData.skills.join(", ")
              : t("noSkills")}
          </p>
          <p>
            <strong>{t("currentJob")}:</strong> {formData.currentJob}
          </p>
          <p>
  <strong>{t("linkedIn")}:</strong>{" "}
  {formData.linkedInLink ? (
    <a href={formData.linkedInLink} target="_blank" rel="noopener noreferrer">
      {formData.linkedInLink}
    </a>
  ) : (
    t("noLinkedIn")
  )}
</p>

<p>
  <strong>{t("phoneNumber")}:</strong> {formData.phoneNumber || t("noPhone")}
</p>
          <button className="edit-btnn" onClick={handleEdit}>
            {t("updateInfo")}
          </button>
        </div>
      ) : (
        <div className="info">
          <label>
            {t("firstName")}:
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />
          </label>
          <label>
            {t("lastName")}:
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />
          </label>
          <label>
            {t("faculty")}:
            <input type="text" name="faculty" value={formData.faculty} disabled />
          </label>
          <label>
            {t("graduationYear")}:
            <input
              type="text"
              name="graduationYear"
              value={formData.graduationYear}
              disabled
            />
          </label>
          <label>
            {t("bio")}:
            <textarea name="bio" value={formData.bio} onChange={handleChange} />
          </label>
          <label>
            {t("skills")}:
            <input
              type="text"
              name="skills"
              value={formData.skills ? formData.skills.join(",") : ""}
              onChange={handleSkillsChange}
            />
          </label>
          <label>
            {t("currentJob")}:
            <input
              type="text"
              name="currentJob"
              value={formData.currentJob}
              onChange={handleChange}
            />
          </label>
          <label>
            {t("profilePhoto")}:
            <input
              className="file-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </label>
          <label>
            {t("cv")}:
            <input
              className="file-input"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvChange}
            />
          </label>
          <label>
  {t("linkedIn")}:
  <input
    type="text"
    name="linkedInLink"
    value={formData.linkedInLink || ""}
    onChange={handleChange}
  />
</label>

<label>
  {t("phoneNumber")}:
  <input
    type="text"
    name="phoneNumber"
    value={formData.phoneNumber || ""}
    onChange={handleChange}
  />
</label>


          <button onClick={handleSave}>{t("save")}</button>
          <button onClick={handleCancel}>{t("cancel")}</button>
        </div>
      )}
    </div>
  );
}

export default GraduatedProfile;


//correct without photo & cv
// import { useState, useEffect } from "react";
// import { useTranslation } from "react-i18next";
// import "./GradProfile.css";
// import PROFILE from "./PROFILE.jpeg";
// import API from "../../services/api";

// function GraduatedProfile() {
//   const [user, setUser] = useState(null);
//   const [editing, setEditing] = useState(false);
//   const [formData, setFormData] = useState(null);
//   const { t } = useTranslation();

//   const storedUser = JSON.parse(localStorage.getItem("user"));
//   const userId = storedUser?.id;

//   useEffect(() => {
//     console.log("userId passed to GraduatedProfile:", userId);
//     fetchUser();
//   }, [userId]);

//   const fetchUser = async () => {
//     try {
//       const res = await API.get(`/graduates/${userId}/profile`);
//       const data = res.data.data;
//       if (data.fullName && (!data.firstName || !data.lastName)) {
//         const parts = data.fullName.split(" ");
//         data.firstName = parts[0] || "";
//         data.lastName = parts.slice(1).join(" ") || "";
//       }

//       setUser(data);
//       setFormData(data);
//     } catch (err) {
//       console.error("Failed to fetch user:", err);
//     }
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSkillsChange = (e) => {
//     setFormData({ ...formData, skills: e.target.value.split(",") });
//   };

//  const handlePhotoChange = (e) => {
//   const file = e.target.files[0];
//   if (file) {
//     setFormData({ ...formData, profilePictureFile: file });
//   }
// };

// const handleCvChange = (e) => {
//   const file = e.target.files[0];
//   if (file) {
//     setFormData({ ...formData, cvFile: file });
//   }
// };


//   const handleEdit = () => {
//     if (user.fullName) {
//       const parts = user.fullName.split(" ");
//       setFormData({
//         ...user,
//         firstName: parts[0] || "",
//         lastName: parts.slice(1).join(" ") || "",
//       });
//     }
//     setEditing(true);
//   };

// const handleSave = async () => {
//   try {
//     const token = localStorage.getItem("token");
//     const payload = new FormData();

//     // البيانات النصية
//     payload.append("firstName", formData.firstName);
//     payload.append("lastName", formData.lastName);
//     payload.append("bio", formData.bio || "");
//     payload.append("currentJob", formData.currentJob || "");
//     payload.append("skills", JSON.stringify(formData.skills || []));
//     payload.append("faculty", formData.faculty || "");
//     payload.append("graduationYear", formData.graduationYear || "");
//     payload.append("linkedlnLink", formData.linkedlnLink || "");

//     // الملفات
//     if (formData.profilePictureFile)
//       payload.append("profilePicture", formData.profilePictureFile);
//     if (formData.cvFile) payload.append("cv", formData.cvFile);

//     const res = await API.put("/graduates/profile", payload, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         // Content-Type يحدد تلقائياً مع FormData
//       },
//     });

//     await fetchUser(); // تحديث البيانات بعد الحفظ
//     setEditing(false);
//   } catch (err) {
//     console.error("Failed to update user:", err.response?.data || err.message);
//   }
// };

//   const handleCancel = () => {
//     setFormData(user);
//     setEditing(false);
//   };

//   if (!user || !formData) return <p>{t("loading")}</p>;

//   const fullName =
//     formData.fullName || `${formData.firstName || ""} ${formData.lastName || ""}`;

//   return (
//     <div>
//       <h1>{t("profile")}</h1>

//       {!editing ? (
//         <div className="profile-card">
//         <img
//   src={formData.profilePicture || PROFILE}
//   alt="Profile"
//   className="profile-img"
// />
//           <h2>{fullName}</h2>
//           <p>
//             <strong>{t("faculty")}:</strong> {formData.faculty}
//           </p>
//           <p>
//             <strong>{t("graduationYear")}:</strong> {formData.graduationYear}
//           </p>
//           <p>
//             <strong>{t("bio")}:</strong> {formData.bio}
//           </p>
//           <p>
//             <strong>{t("cv")}:</strong>{" "}
//            {formData.CV ? (
//   <a href={formData.CV} download>
//     {t("downloadCv")}
//   </a>
// ) : (
//   t("noCv")
// )}
//           </p>
//           <p>
//             <strong>{t("skills")}:</strong>{" "}
//             {formData.skills ? formData.skills : t("noSkills")}
//           </p>
//           <p>
//             <strong>{t("currentJob")}:</strong> {formData.currentJob}
//           </p>
//           {/* <button onClick={() => setEditing(true)}>{t("updateInfo")}</button> */}
//           <button className="edit-btnn" onClick={handleEdit}>{t("updateInfo")}</button>

//         </div>
//       ) : (
//         <div className="info">
//           <label>
//             {t("firstName")}:
//             <input
//               type="text"
//               name="firstName"
//               value={formData.firstName}
//               onChange={handleChange}
//             />
//           </label>
//           <label>
//             {t("lastName")}:
//             <input
//               type="text"
//               name="lastName"
//               value={formData.lastName}
//               onChange={handleChange}
//             />
//           </label>
//         <label>
//             {t("faculty")}:
//             <input
//               type="text"
//               name="faculty"
//               value={formData.faculty}

//            disabled

//             />
//           </label>
//           <br />

//           <label>
//             {t("graduationYear")}:
//             <input
//               type="text"
//               name="graduationYear"
//               value={formData.graduationYear}
//               disabled

//             />
//           </label>
//           <br />
//           <label>
//             {t("bio")}:
//             <textarea
//               name="bio"
//               value={formData.bio}
//               onChange={handleChange}
//             />
//           </label>
//           <label>
//             {t("skills")}:
//             <input
//               type="text"
//               name="skills"
//               value={formData.skills ? formData.skills: ""}
//               onChange={handleSkillsChange}
//             />
//           </label>
//           <label>
//             {t("currentJob")}:
//             <input
//               type="text"
//               name="currentJob"
//               value={formData.currentJob}
//               onChange={handleChange}
//             />
//           </label>
//           <label>
//             {t("profilePhoto")}:
//             <input className="file-input" type="file" accept="image/*" onChange={handlePhotoChange} />
//           </label>
//           <label>
//             {t("cv")}:
//             <input className="file-input" type="file" accept=".pdf,.doc,.docx" onChange={handleCvChange} />
//           </label>

//           <button onClick={handleSave}>{t("save")}</button>
//           <button onClick={handleCancel}>{t("cancel")}</button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default GraduatedProfile;




