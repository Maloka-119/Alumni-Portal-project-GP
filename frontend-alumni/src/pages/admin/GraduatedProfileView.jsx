import PROFILE from "./PROFILE.jpeg";
import React from "react";
import "./GradProfile.css";
import { useTranslation } from "react-i18next";

function GraduatedProfileView({ user }) {
  const { t } = useTranslation();
  if (!user) return <p>{t("No profile data found")}</p>;

  return (
    <div>
      <h1 className="h1">{t("Profile")}</h1>

      <div className="profile-card">
        <img
          src={user.profilePicture || PROFILE}
          alt="Profile"
          className="profile-img"
        />
        <h2>{user.fullName || "No Name"}</h2>

        <p><strong>{t("Faculty")}:</strong> {user.faculty || "Not provided"}</p>
        <p><strong>{t("Graduation Year")}:</strong> {user.graduationYear}</p>
        <p><strong>{t("Phone Number")}:</strong> {user.phoneNumber || "noPhone"}</p>
        <p><strong>{t("Bio")}:</strong> {user.bio || t("No bio")}</p>
        <p>
          <strong>CV:</strong>{" "}
          {user.CV ? (
            <a href={user.CV} download="My_CV">
              {t("Download CV")}
            </a>
          ) : (
            t("No CV uploaded")
          )}
        </p>
        <p>
          <strong>{t("Skills")}:</strong>{" "}
          {user.skills ? user.skills : t("No skills")}
        </p>
        <p><strong>{t("Current Job")}:</strong> {user.currentJob || t("Not provided")}</p>
        {user.linkedInLink && (
          <p>
            <strong>{t("LinkedIn")}:</strong>{" "}
            <a href={user.linkedInLink} target="_blank" rel="noreferrer">
            {t("View Profile")}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default GraduatedProfileView;




// import React from "react";
// import "./GradProfile.css";

// function GraduatedProfileView({ user }) {
//   const fullName = user.firstName && user.lastName 
//     ? `${user.firstName} ${user.lastName}` 
//     : user.name || "No Name";

//   return (
//     <div>
//       <h1 className="h1">Profile</h1>

//       <div className="profile-card">
//         <img
//           src={user.profilePicture || PROFILE}
//           alt="Profile"
//           className="profile-img"
//         />
//         <h2>{fullName}</h2>

//         <p><strong>Faculty:</strong> {user.faculty || "Not provided"}</p>
//         <p><strong>Graduation Year:</strong> {user.graduationYear}</p>
//         <p><strong>Bio:</strong> {user.bio || "No bio"}</p>
//         <p>
//           <strong>CV:</strong>{" "}
//           {user.cv ? (
//             <a href={user.cv} download="My_CV">
//               Download CV
//             </a>
//           ) : (
//             "No CV uploaded"
//           )}
//         </p>
//         <p>
//           <strong>Skills:</strong>{" "}
//           {Array.isArray(user.skills) && user.skills.length > 0
//             ? user.skills.join(", ")
//             : "No skills"}
//         </p>
//         <p><strong>Current Job:</strong> {user.currentJob || "Not provided"}</p>
//       </div>
//     </div>
//   );
// }

// export default GraduatedProfileView;
