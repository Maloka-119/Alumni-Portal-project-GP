import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./GradProfile.css";
import PROFILE from "./PROFILE.jpeg";
import API from "../services/api";

function GraduatedProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const res = await API.get(`/graduates/${userId}/profile`);
      setUser(res.data);
      setFormData(res.data);
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
    if (file) setFormData({ ...formData, profilePictureFile: file });
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData({ ...formData, cvFile: file });
  };

  const handleSave = async () => {
    try {
      const payload = new FormData();
      payload.append("firstName", formData.firstName);
      payload.append("lastName", formData.lastName);
      payload.append("faculty", formData.faculty);
      payload.append("graduationYear", formData.graduationYear);
      payload.append("bio", formData.bio);
      payload.append("currentJob", formData.currentJob);
      payload.append("skills", formData.skills.join(","));
      if (formData.profilePictureFile) payload.append("profilePicture", formData.profilePictureFile);
      if (formData.cvFile) payload.append("cv", formData.cvFile);

      const res = await API.put(`/graduates/${userId}/profile`, payload);
      setUser(res.data);
      setFormData(res.data);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setEditing(false);
  };

  if (!user || !formData) return <p>{t("loading")}</p>;

  const fullName = `${formData.firstName} ${formData.lastName}`;

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
          <p><strong>{t("faculty")}:</strong> {formData.faculty}</p>
          <p><strong>{t("graduationYear")}:</strong> {formData.graduationYear}</p>
          <p><strong>{t("bio")}:</strong> {formData.bio}</p>
          <p>
            <strong>{t("cv")}:</strong>{" "}
            {formData.cv ? (
              <a href={formData.cv} download>
                {t("downloadCv")}
              </a>
            ) : t("noCv")}
          </p>
          <p><strong>{t("skills")}:</strong> {formData.skills.join(", ")}</p>
          <p><strong>{t("currentJob")}:</strong> {formData.currentJob}</p>
          <button onClick={() => setEditing(true)}>
            {t("updateInfo")}
          </button>
        </div>
      ) : (
        <div className="info">
          <label>
            {t("firstName")}:
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
          </label>
          <label>
            {t("lastName")}:
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
          </label>
          <label>
            {t("faculty")}:
            <input type="text" name="faculty" value={formData.faculty} onChange={handleChange} />
          </label>
          <label>
            {t("graduationYear")}:
            <input type="text" name="graduationYear" value={formData.graduationYear} onChange={handleChange} />
          </label>
          <label>
            {t("bio")}:
            <textarea name="bio" value={formData.bio} onChange={handleChange} />
          </label>
          <label>
            {t("skills")}:
            <input type="text" name="skills" value={formData.skills.join(",")} onChange={handleSkillsChange} />
          </label>
          <label>
            {t("currentJob")}:
            <input type="text" name="currentJob" value={formData.currentJob} onChange={handleChange} />
          </label>
          <label>
            {t("profilePhoto")}:
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </label>
          <label>
            {t("cv")}:
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleCvChange} />
          </label>

          <button onClick={handleSave}>{t("save")}</button>
          <button onClick={handleCancel}>{t("cancel")}</button>
        </div>
      )}
    </div>
  );
}

export default GraduatedProfile;




// import { useState } from "react";
// // import Footer from "./Footer";
// import "./GradProfile.css";
// import PROFILE from "./PROFILE.jpeg";


// function GraduatedProfile() {
//   const initialUser = {
//     profilePicture: "",
//     firstName: "Omar",
//     lastName: "Emad Sayed",
//     faculty: "Computer Science",
//     graduationYear: "2024/2025",
//     bio: "Software Engineering student passionate about web development and backend systems.",
//     cv: "", // initially no CV uploaded
//     skills: ["Java", "Python", "React", "SQL"],
//     currentJob: "Frontend Developer Intern",
//   };

//   const [user, setUser] = useState(initialUser);
//   const [editing, setEditing] = useState(false);
//   const [formData, setFormData] = useState(user);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSkillsChange = (e) => {
//     setFormData({ ...formData, skills: e.target.value.split(",") });
//   };

//   const handlePhotoChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setFormData({ ...formData, profilePicture: reader.result });
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleCvChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const fileURL = URL.createObjectURL(file);
//       setFormData({ ...formData, cv: fileURL });
//     }
//   };

//   const handleSave = () => {
//     setUser(formData);
//     setEditing(false);
//   };

//   const handleCancel = () => {
//     setFormData(user);
//     setEditing(false);
//   };

//   const fullName = `${user.firstName} ${user.lastName}`;

//   return (
//     <div
//     >
//       <h1 className="h1">Profile</h1>

//       {/* View Mode */}
//       {!editing ? (
//         <div className="profile-card">
//           <img
//             src={user.profilePicture || PROFILE}
//             alt="Profile"
//             className="profile-img"
//           />
//           <h2>{fullName}</h2>
          
//           <p><strong>Faculty:</strong> {user.faculty}</p>
//           <p><strong>Graduation Year:</strong> {user.graduationYear}</p>
//           <p><strong>Bio:</strong> {user.bio}</p>
//           <p>
//             <strong>CV:</strong>{" "}
//             {user.cv ? (
//               <a href={user.cv} download="My_CV">
//                 Download CV
//               </a>
//             ) : (
//               "No CV uploaded"
//             )}
//           </p>
//           <p><strong>Skills:</strong> {user.skills.join(", ")}</p>
//           <p><strong>Current Job:</strong> {user.currentJob}</p>

//           <button className="button" onClick={() => setEditing(true)}>
//             Update your Info
//           </button>
//         </div>
//       ) : (
//         // Edit Mode
//         <div className="info">
//           <label>
//             First Name:
//             <input
//               type="text"
//               name="firstName"
//               value={formData.firstName}
//               onChange={handleChange}
//             />
//           </label>
//           <br />
//           <label>
//             Last Name:
//             <input
//               type="text"
//               name="lastName"
//               value={formData.lastName}
//               onChange={handleChange}
//             />
//           </label>
//           <br />
//           <label>
//             Faculty:
//             <input
//               type="text"
//               name="faculty"
//               value={formData.faculty}
//               onChange={handleChange}
//             />
//           </label>
//           <br />
//           <label>
//             Graduation Year:
//             <input
//               type="text"
//               name="graduationYear"
//               value={formData.graduationYear}
//               onChange={handleChange}
//             />
//           </label>
//           <br />
//           <label>
//             Bio:
//             <textarea
//               name="bio"
//               value={formData.bio}
//               onChange={handleChange}
//             />
//           </label>
//           <br />
//           <label>
//             Upload CV (PDF/DOCX):
//             <input
//               type="file"
//               accept=".pdf,.doc,.docx"
//               onChange={handleCvChange}
//             />
//           </label>
//           <br />
//           <label>
//             Skills (comma separated):
//             <input
//               type="text"
//               name="skills"
//               value={formData.skills.join(",")}
//               onChange={handleSkillsChange}
//             />
//           </label>
//           <br />
//           <label>
//             Current Job:
//             <input
//               type="text"
//               name="currentJob"
//               value={formData.currentJob}
//               onChange={handleChange}
//             />
//           </label>
//           <br />
//           <label>
//             Profile Photo:
//             <input type="file" accept="image/*" onChange={handlePhotoChange} />
//           </label>
//           <br />

//           <button className="button" onClick={handleSave}>Save</button>
//           <button className="button" onClick={handleCancel}>Cancel</button>
//         </div>
//       )}

//       {/* <Footer /> */}
//     </div>
//   );
// }

// export default GraduatedProfile;
