// import { useState, useEffect } from "react";
// import { useTranslation } from "react-i18next";
// import "./GradProfile.css";
// import PROFILE from "./PROFILE.jpeg";
// import API from "../../services/api";
// import { Upload } from "lucide-react";

// function GraduatedProfile() {
//   const [user, setUser] = useState(null);
//   const [editing, setEditing] = useState(false);
//   const [formData, setFormData] = useState(null);
//   const { t } = useTranslation();
//   const [profileFileName, setProfileFileName] = useState("");
// const [cvFileName, setCvFileName] = useState("");

//   const storedUser = JSON.parse(localStorage.getItem("user"));
//   const userId = storedUser?.id;

//   useEffect(() => {
//     if (userId) fetchUser();
//   }, [userId]);

//   const preprocessData = (data) => {
//     const newData = { ...data };

//     // fullName -> firstName & lastName
//     if (newData.fullName && (!newData.firstName || !newData.lastName)) {
//       const parts = newData.fullName.split(" ");
//       newData.firstName = parts[0] || "";
//       newData.lastName = parts.slice(1).join(" ") || "";
//     }

//     // skills string -> array
//     if (typeof newData.skills === "string") {
//       try {
//         newData.skills = JSON.parse(newData.skills);
//       } catch {
//         newData.skills = [];
//       }
//     }

//     // showCV & showPhone -> boolean
//     newData.showCV = Boolean(newData.showCV);
//     newData.showPhone = Boolean(newData.showPhone);

//     // phone fallback
//     if (!newData.phoneNumber) newData.phoneNumber = "";

//     return newData;
//   };

//   const fetchUser = async () => {
//     try {
//       const res = await API.get(`/graduates/${userId}/profile`);
//       console.log("Fetched profile data:", res.data.data);
//       const data = preprocessData(res.data.data);
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

//   const handlePhotoChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setProfileFileName(file.name); 
//     const validExtensions = ["image/jpeg", "image/jpg"];
//     if (!validExtensions.includes(file.type)) {
//       alert("Only JPG images are allowed");
//       e.target.value = "";
//       setProfileFileName("");
//       return;
//     }

//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = (event) => {
//       const img = new Image();
//       img.src = event.target.result;
//       img.onload = () => {
//         const canvas = document.createElement("canvas");
//         const ctx = canvas.getContext("2d");

//         const maxWidth = 800;
//         const maxHeight = 800;

//         let width = img.width;
//         let height = img.height;

//         if (width > height) {
//           if (width > maxWidth) {
//             height = Math.round((height *= maxWidth / width));
//             width = maxWidth;
//           }
//         } else {
//           if (height > maxHeight) {
//             width = Math.round((width *= maxHeight / height));
//             height = maxHeight;
//           }
//         }

//         canvas.width = width;
//         canvas.height = height;
//         ctx.drawImage(img, 0, 0, width, height);

//         canvas.toBlob(
//           (blob) => {
//             const compressedFile = new File([blob], file.name, {
//               type: "image/jpeg",
//               lastModified: Date.now(),
//             });

//             setFormData({ ...formData, profilePictureFile: compressedFile });
//           },
//           "image/jpeg",
//           0.7
//         );
//       };
//     };
//   };

//   const handleCvChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setCvFileName(file.name);
//       setFormData({ ...formData, cvFile: file });
//     }
//   };

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

//   const handleSave = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const payload = new FormData();

//       payload.append("firstName", formData.firstName);
//       payload.append("lastName", formData.lastName);
//       payload.append("bio", formData.bio || "");
//       payload.append("currentJob", formData.currentJob || "");
//       payload.append("skills", JSON.stringify(formData.skills || []));
//       payload.append("faculty", formData.faculty || "");
//       payload.append("graduationYear", formData.graduationYear || "");
//       payload.append("phoneNumber", formData.phoneNumber || "");
//       payload.append("showCV", formData.showCV);
//       payload.append("showPhone", formData.showPhone);

//       if (formData.profilePictureFile)
//         payload.append("profilePicture", formData.profilePictureFile);
//       if (formData.cvFile) payload.append("cv", formData.cvFile);

//       const res = await API.put("/graduates/profile", payload, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const updatedData = preprocessData(res.data.data);
//       setUser(updatedData);
//       setFormData(updatedData);
//       setEditing(false);
//     } catch (err) {
//       console.error("Failed to update user:", err.response?.data || err.message);
//     }
//   };

//   const handleCancel = () => {
//     setFormData(user);
//     setEditing(false);
//   };

//   if (!user || !formData) return <p>{t("loading")}</p>;

//   const fullName =
//     formData.fullName || `${formData.firstName || ""} ${formData.lastName || ""}`;

//   return (
//     <div className="profile-page">
//       <h1 className="uni-header">{t("profile")}</h1>

//       {!editing ? (
//         <div className="profile-card">
//           <img
//             src={formData.profilePicture || PROFILE}
//             alt="Profile"
//             className="profile-img"
//           />
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

//           {formData.showCV && (
// <p>
//   <strong>{t("cv")}:</strong>{" "}
//   {formData.CV ? (
//     <a href={formData.CV} download target="_blank" rel="noopener noreferrer">
//       {t("downloadCv")}
//     </a>
//   ) : (
//     t("noCv")
//   )}
// </p>



//           )}
//           <p>
//             <strong>{t("skills")}:</strong>{" "}
//             {formData.skills && formData.skills.length > 0
//               ? formData.skills.join(", ")
//               : t("noSkills")}
//           </p>
//           <p>
//             <strong>{t("currentJob")}:</strong> {formData.currentJob}
//           </p>

//           {formData.showPhone && (
//             <p>
//               <strong>{t("phoneNumber")}:</strong> {formData.phoneNumber || t("noPhone")}
//             </p>
//           )}

//           <button className="edit-btnn" onClick={handleEdit}>
//             {t("updateInfo")}
//           </button>
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
//           <label>
//             {t("faculty")}:
//             <input type="text" name="faculty" value={formData.faculty} disabled />
//           </label>
//           <label>
//             {t("graduationYear")}:
//             <input
//               type="text"
//               name="graduationYear"
//               value={formData.graduationYear}
//               disabled
//             />
//           </label>
//           <label>
//             {t("bio")}:
//             <textarea name="bio" value={formData.bio} onChange={handleChange} />
//           </label>
//           <label>
//             {t("skills")}:
//             <input
//               type="text"
//               name="skills"
//               value={formData.skills ? formData.skills.join(",") : ""}
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

//           <label className="upload-label">
//             <Upload size={18} />
//             <span className="upload-text">{t("profilePhoto")}</span>
//             <input
//               className="upload-input"
//               type="file"
//               accept="image/jpeg"
//               onChange={handlePhotoChange}
//             />
//             {profileFileName && <span className="file-name">{profileFileName}</span>}
//           </label>

//           <label className="upload-label">
//             <Upload size={18} />
//             <span className="upload-text">{t("cv")}</span>
//             <input
//               className="upload-input"
//               type="file"
//               accept=".pdf,.doc,.docx"
//               onChange={handleCvChange}
//             />
//              {cvFileName && <span className="file-name">{cvFileName}</span>}
//           </label>

//           <label>
//             {t("phoneNumber")}:
//             <input
//               type="text"
//               name="phoneNumber"
//               value={formData.phoneNumber || ""}
//               onChange={handleChange}
//             />
//           </label>

//           <div className="visibility-options">
//             <label className="checkboxpro-label">
//               <input
//                 type="checkbox"
//                 name="showCV"
//                 checked={formData.showCV || false}
//                 onChange={(e) =>
//                   setFormData({ ...formData, showCV: e.target.checked })
//                 }
//               />
//               {t("showCv")}
//             </label>

//             <label className="checkboxpro-label">
//               <input
//                 type="checkbox"
//                 name="showPhone"
//                 checked={formData.showPhone || false}
//                 onChange={(e) =>
//                   setFormData({ ...formData, showPhone: e.target.checked })
//                 }
//               />
//               {t("showPhone")}
//             </label>
//           </div>

//           <button className="saveprof" onClick={handleSave}>
//             {t("save")}
//           </button>
//           <button className="cancelprof" onClick={handleCancel}>
//             {t("cancel")}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default GraduatedProfile;


import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./GradProfile.css";
import PROFILE from "./PROFILE.jpeg";
import API from "../../services/api";
import { Upload, Trash2 } from "lucide-react";

function GraduatedProfile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const { t } = useTranslation();
  const [profileFileName, setProfileFileName] = useState("");
  const [cvFileName, setCvFileName] = useState("");

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  useEffect(() => {
    if (userId) fetchUser();
  }, [userId]);

  const preprocessData = (data) => {
    const newData = { ...data };

    if (newData.fullName && (!newData.firstName || !newData.lastName)) {
      const parts = newData.fullName.split(" ");
      newData.firstName = parts[0] || "";
      newData.lastName = parts.slice(1).join(" ") || "";
    }

    if (typeof newData.skills === "string") {
      try {
        newData.skills = JSON.parse(newData.skills);
      } catch {
        newData.skills = [];
      }
    }

    newData.showCV = Boolean(newData.showCV);
    newData.showPhone = Boolean(newData.showPhone);

    if (!newData.phoneNumber) newData.phoneNumber = "";

    return newData;
  };

  const fetchUser = async () => {
    try {
      const res = await API.get(`/graduates/${userId}/profile`);
      const data = preprocessData(res.data.data);
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
    if (!file) return;
    setProfileFileName(file.name);
    const validExtensions = ["image/jpeg", "image/jpg"];
    if (!validExtensions.includes(file.type)) {
      alert("Only JPG images are allowed");
      e.target.value = "";
      setProfileFileName("");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const maxWidth = 800;
        const maxHeight = 800;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height *= maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width *= maxHeight / height));
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            setFormData({ ...formData, profilePictureFile: compressedFile, removeProfilePicture: false });
          },
          "image/jpeg",
          0.7
        );
      };
    };
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCvFileName(file.name);
      setFormData({ ...formData, cvFile: file, removeCV: false });
    }
  };

  const handleRemoveProfilePicture = () => {
    setFormData({ 
      ...formData, 
      profilePictureFile: null, 
      profilePicture: null, 
      removeProfilePicture: true 
    });
    setProfileFileName("");
    alert("Profile photo removed");
  };

  const handleRemoveCv = () => {
    setFormData({ 
      ...formData, 
      cvFile: null, 
      CV: null, 
      removeCV: true 
    });
    setCvFileName("");
    alert("CV removed");
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

      payload.append("firstName", formData.firstName);
      payload.append("lastName", formData.lastName);
      payload.append("bio", formData.bio || "");
      payload.append("currentJob", formData.currentJob || "");
      payload.append("skills", JSON.stringify(formData.skills || []));
      payload.append("faculty", formData.faculty || "");
      payload.append("graduationYear", formData.graduationYear || "");
      payload.append("phoneNumber", formData.phoneNumber || "");
      payload.append("showCV", formData.showCV);
      payload.append("showPhone", formData.showPhone);

      if (formData.profilePictureFile) {
        payload.append("profilePicture", formData.profilePictureFile);
      } else if (formData.removeProfilePicture) {
        payload.append("removeProfilePicture", true);
      }

      if (formData.cvFile) {
        payload.append("cv", formData.cvFile);
      } else if (formData.removeCV) {
        payload.append("removeCV", true);
      }

      const res = await API.put("/graduates/profile", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedData = preprocessData(res.data.data);
      setUser(updatedData);
      setFormData(updatedData);
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
    <div className="profile-page">
      <h1 className="uni-header">{t("profile")}</h1>

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

          {formData.showCV && (
            <p>
              <strong>{t("cv")}:</strong>{" "}
              {formData.CV ? (
                <a href={formData.CV} download target="_blank" rel="noopener noreferrer">
                  {t("downloadCv")}
                </a>
              ) : (
                t("noCv")
              )}
            </p>
          )}

          <p>
            <strong>{t("skills")}:</strong>{" "}
            {formData.skills && formData.skills.length > 0
              ? formData.skills.join(", ")
              : t("noSkills")}
          </p>
          <p>
            <strong>{t("currentJob")}:</strong> {formData.currentJob}
          </p>

          {formData.showPhone && (
            <p>
              <strong>{t("phoneNumber")}:</strong> {formData.phoneNumber || t("noPhone")}
            </p>
          )}

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

          <label className="upload-label">
            <Upload size={18} />
            <span className="upload-text">{t("profilePhoto")}</span>
            <input
              className="upload-input"
              type="file"
              accept="image/jpeg"
              onChange={handlePhotoChange}
            />
            {(profileFileName || formData.profilePicture) && (
              <div className="file-wrapper">
                <span className="file-name">{profileFileName || "Existing Photo"}</span>
                <Trash2 size={16} className="delete-icon" onClick={handleRemoveProfilePicture} />
              </div>
            )}
          </label>

          <label className="upload-label">
            <Upload size={18} />
            <span className="upload-text">{t("cv")}</span>
            <input
              className="upload-input"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvChange}
            />
            {(cvFileName || formData.CV) && (
              <div className="file-wrapper">
                <span className="file-name">{cvFileName || "Existing CV"}</span>
                <Trash2 size={16} className="delete-icon" onClick={handleRemoveCv} />
              </div>
            )}
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

          <div className="visibility-options">
            <label className="checkboxpro-label">
              <input
                type="checkbox"
                name="showCV"
                checked={formData.showCV || false}
                onChange={(e) =>
                  setFormData({ ...formData, showCV: e.target.checked })
                }
              />
              {t("showCv")}
            </label>

            <label className="checkboxpro-label">
              <input
                type="checkbox"
                name="showPhone"
                checked={formData.showPhone || false}
                onChange={(e) =>
                  setFormData({ ...formData, showPhone: e.target.checked })
                }
              />
              {t("showPhone")}
            </label>
          </div>

          <button className="saveprof" onClick={handleSave}>
            {t("save")}
          </button>
          <button className="cancelprof" onClick={handleCancel}>
            {t("cancel")}
          </button>
        </div>
      )}
    </div>
  );
}

export default GraduatedProfile;
