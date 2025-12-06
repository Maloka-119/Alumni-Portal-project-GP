
// import React, { useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { FcGoogle } from "react-icons/fc"

// const GoogleLoginButton = ({ setUser }) => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const handleGoogleLogin = () => {
//     window.open("http://localhost:5005/alumni-portal/auth/google", "_self");
//   };

//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const token = params.get("token");
//     const id = params.get("id");
//     const email = params.get("email");
//     const userType = params.get("userType");
//     let nationalId = params.get("nationalId");

//     // تحويل "null" string لـ null
//     if (nationalId === "null") nationalId = null;

//     if (token && id && email && userType) {
//       if (!nationalId) {
//         // المستخدم يحتاج لإكمال البيانات أولًا
//         navigate(
//           `/helwan-alumni-portal/complete-registration?email=${email}&token=${token}&userType=${userType}`,
//           { replace: true }
//         );
//       } else {
//         // تخزين البيانات في localStorage بعد التأكد إن الرقم القومي موجود
//         const user = { id, email, userType, nationalId };
//         localStorage.setItem("token", token);
//         localStorage.setItem("user", JSON.stringify(user));
//         if (setUser) setUser(user);

//         // توجيه المستخدم للداشبورد المناسب
//         if (userType === "admin") {
//           navigate("/helwan-alumni-portal/admin/dashboard", { replace: true });
//         } else if (userType === "graduate") {
//           navigate("/helwan-alumni-portal/graduate/dashboard", { replace: true });
//         } else if (userType === "staff") {
//           navigate("/helwan-alumni-portal/staff/dashboard", { replace: true });
//         }
//       }
//     }
//   }, [location.search, navigate, setUser]);

//   return (
//     <button
//   onClick={handleGoogleLogin}
//   style={{
//     display: "flex",
//     alignItems: "center",
//     gap: "8px",
//     padding: "10px 16px",
//     background: "#f5f5f5",
//     color: "#000",
//     border: "1px solid #dadce0",
//     borderRadius: "4px",
//     cursor: "pointer",
//     fontWeight: "500",
//     width: "100%",
//     justifyContent: "center",
//     transition: "background 0.2s"
//   }}
//   onMouseEnter={(e) => {
//     e.currentTarget.style.background = "#fff"
//   }}
//   onMouseLeave={(e) => {
//     e.currentTarget.style.background = "#f5f5f5"
//   }}
// >
//   <FcGoogle size={20} />
//   Sign in with Google
// </button>

//   );
// };

// export default GoogleLoginButton;

import React from "react";
import { FcGoogle } from "react-icons/fc";

const GoogleLoginButton = ({ onClick, text  }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 16px",
        background: "#f5f5f5",
        color: "#000",
        border: "1px solid #dadce0",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
        width: "85%",
        justifyContent: "center",
        transition: "background 0.2s",
        margin: "0 auto", 
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "#fff"}
      onMouseLeave={(e) => e.currentTarget.style.background = "#f5f5f5"}
    >
      <FcGoogle size={20} />
      {text || "Sign Up with Google"}
    </button>
  );
};

export default GoogleLoginButton;
