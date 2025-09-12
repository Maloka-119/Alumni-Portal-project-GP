import React, { useEffect, useState } from "react";
import "./GradProfile.css";
import PROFILE from "./PROFILE.jpeg";

function GraduatedProfileView() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // غير اللينك حسب الباك إند عندك
  const API_URL = "http://localhost:5000/api/graduates/1";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <p>Loading profile...</p>;
  if (!user) return <p>No profile data found</p>;

  const fullName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.name || "No Name";

  return (
    <div>
      <h1 className="h1">Profile</h1>

      <div className="profile-card">
        <img
          src={user.profilePicture || PROFILE}
          alt="Profile"
          className="profile-img"
        />
        <h2>{fullName}</h2>

        <p><strong>Faculty:</strong> {user.faculty || "Not provided"}</p>
        <p><strong>Graduation Year:</strong> {user.graduationYear}</p>
        <p><strong>Bio:</strong> {user.bio || "No bio"}</p>
        <p>
          <strong>CV:</strong>{" "}
          {user.cv ? (
            <a href={user.cv} download="My_CV">
              Download CV
            </a>
          ) : (
            "No CV uploaded"
          )}
        </p>
        <p>
          <strong>Skills:</strong>{" "}
          {Array.isArray(user.skills) && user.skills.length > 0
            ? user.skills.join(", ")
            : "No skills"}
        </p>
        <p><strong>Current Job:</strong> {user.currentJob || "Not provided"}</p>
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
//           src={user.profilePicture || "/OIP.webp"}
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
