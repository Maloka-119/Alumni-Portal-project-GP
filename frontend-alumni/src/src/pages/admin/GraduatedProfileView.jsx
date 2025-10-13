import PROFILE from "./PROFILE.jpeg";
import React from "react";
import "./GradProfile.css";

function GraduatedProfileView({ user }) {
  if (!user) return <p>No profile data found</p>;

  return (
    <div>
      <h1 className="h1">Profile</h1>

      <div className="profile-card">
        <img
          src={user.profilePicture || PROFILE}
          alt="Profile"
          className="profile-img"
        />
        <h2>{user.fullName || "No Name"}</h2>

        <p><strong>Faculty:</strong> {user.faculty || "Not provided"}</p>
        <p><strong>Graduation Year:</strong> {user.graduationYear}</p>
        <p><strong>Phone Number:</strong> {user.phoneNumber || "noPhone"}</p>
        <p><strong>Bio:</strong> {user.bio || "No bio"}</p>
        <p>
          <strong>CV:</strong>{" "}
          {user.CV ? (
            <a href={user.CV} download="My_CV">
              Download CV
            </a>
          ) : (
            "No CV uploaded"
          )}
        </p>
        <p>
          <strong>Skills:</strong>{" "}
          {user.skills ? user.skills : "No skills"}
        </p>
        <p><strong>Current Job:</strong> {user.currentJob || "Not provided"}</p>
        {user.linkedInLink && (
          <p>
            <strong>LinkedIn:</strong>{" "}
            <a href={user.linkedInLink} target="_blank" rel="noreferrer">
              View Profile
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
