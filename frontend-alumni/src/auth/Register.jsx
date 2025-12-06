// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import Header from "../components/Header";
// import Footer from "../components/Footer";
// import GoogleLoginButton from "../components/GoogleLoginButton";
// import LinkedInSignUp from "./LinkedInSignUp";
// import Unibackground from "./Unibackground.jpeg";
// import API from "../services/api";
// import Swal from "sweetalert2";
// import { useTranslation } from "react-i18next";
// import "./Register.css";

// const Register = ({ setUser }) => {
//   const { t } = useTranslation();
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     nationalId: '',
//     firstName: '',
//     lastName: '',
//     password: '',
//     confirmPassword: '',
//     email: '',
//     phoneNumber: ''
//   });

//   const [loading, setLoading] = useState(false);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     if (formData.password !== formData.confirmPassword) {
//       Swal.fire({ icon: "warning", title: t("passwordsNotMatch"), timer: 2500, showConfirmButton: false });
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await API.post("/register", formData);

//       if (response.status === 201 || response.status === 200) {
//         Swal.fire({ icon: "success", title: t("registrationSuccess"), text: t("youCanNowLogin"), timer: 2000, showConfirmButton: false });
//         setTimeout(() => navigate("/helwan-alumni-portal/login"), 2000);
//       } else {
//         Swal.fire({ icon: "error", title: t("registrationFailed"), text: response.data.message || "Something went wrong" });
//       }
//     } catch (error) {
//       Swal.fire({ icon: "error", title: t("error"), text: error.response?.data?.message || "Something went wrong" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="recontainer" style={{ backgroundImage: `url(${Unibackground})` }}>
//       <Header />
//       <div className="wrapper">
//         <form className="form-container" onSubmit={handleSubmit}>
//           <h2 className="main-title">{t("createAccount")}</h2>
//           <p className="subtitle">{t("helwan")}</p><br />
//           <div className="form-grid">
//             {[
//               { name: "nationalId", type: "text" },
//               { name: "email", type: "email" },
//               { name: "firstName", type: "text" },
//               { name: "lastName", type: "text" },
//               { name: "password", type: "password" },
//               { name: "confirmPassword", type: "password" },
//               { name: "phoneNumber", type: "tel", className: "phone-center" },
//             ].map(field => (
//               <div className={`form-group ${field.className || ""}`} key={field.name}>
//                 <label className="form-label">{t(field.name)}</label>
//                 <input
//                   type={field.type}
//                   name={field.name}
//                   value={formData[field.name]}
//                   onChange={handleInputChange}
//                   className="form-inputre"
//                 />
//               </div>
//             ))}
//           </div>

//           <div className="submit-section">
//             <button type="submit" className="register-btn" disabled={loading}>
//               {loading ? t("registering") : t("register")}
//             </button>
//           </div>

//           <LinkedInSignUp />
//           <GoogleLoginButton setUser={setUser} />
//         </form>
//         <Footer />
//       </div>
//     </div>
//   );
// };

// export default Register;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import GoogleLoginButton from "../components/GoogleLoginButton";
import LinkedInSignUp from "./LinkedInSignUp";
import Unibackground from "./Unibackground.jpeg";
import API from "../services/api";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import "./Register.css";

const Register = ({ setUser }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showNidModal, setShowNidModal] = useState(false);
  const [googleNationalId, setGoogleNationalId] = useState("");

  const [formData, setFormData] = useState({
    nationalId: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    email: "",
    phoneNumber: ""
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: t("passwordsNotMatch"),
        timer: 2500,
        showConfirmButton: false
      });
      setLoading(false);
      return;
    }

    try {
      const response = await API.post("/register", formData);

      if (response.status === 201 || response.status === 200) {
        Swal.fire({
          icon: "success",
          title: t("registrationSuccess"),
          text: t("youCanNowLogin"),
          timer: 2000,
          showConfirmButton: false
        });
        setTimeout(() => navigate("/helwan-alumni-portal/login"), 2000);
      } else {
        Swal.fire({
          icon: "error",
          title: t("registrationFailed"),
          text: response.data.message
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t("error"),
        text: err.response?.data?.message || "Something went wrong"
      });
    } finally {
      setLoading(false);
    }
  };

  // Start Google OAuth flow
  const startGoogleFlow = () => {
    if (!googleNationalId.trim()) {
      Swal.fire({
        icon: "warning",
        title: t("enterNationalId"),
      });
      return;
    }
    // إرسال الرقم القومي في query param
    window.open(
      `http://localhost:5005/alumni-portal/auth/google?nationalId=${encodeURIComponent(googleNationalId)}`,
      "_self"
    );
  };

  const handleGoogleNidSubmit = () => {
    startGoogleFlow();
  };

  return (
    <div className="recontainer" style={{ backgroundImage: `url(${Unibackground})` }}>
      <Header />

      <div className="wrapper">
        <div className="form-container">

          <form onSubmit={handleSubmit}>
            <h2 className="main-title">{t("createAccount")}</h2>
            <p className="subtitle">{t("helwan")}</p>
            <br />

            <div className="form-grid">
              {[
                { name: "nationalId", type: "text" },
                { name: "email", type: "email" },
                { name: "firstName", type: "text" },
                { name: "lastName", type: "text" },
                { name: "password", type: "password" },
                { name: "confirmPassword", type: "password" },
                { name: "phoneNumber", type: "tel", className: "phone-center" }
              ].map((field) => (
                <div className={`form-group ${field.className || ""}`} key={field.name}>
                  <label className="form-label">{t(field.name)}</label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    className="form-inputre"
                  />
                </div>
              ))}
            </div>

            <div className="submit-section">
              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? t("registering") : t("register")}
              </button>
            </div>
          </form>

          <hr className="form-divider" />

          <LinkedInSignUp />

          <GoogleLoginButton
            onClick={() => setShowNidModal(true)}
            text={t("signUpWithGoogle")}
          />

        </div>

        {/* ========= National ID Modal for Google ========= */}
        {showNidModal && (
          <div className="nid-overlay">
            <div className="nid-box">
              <h3>{t("enterYourNationalId")}</h3>

              <input
                type="number"
                className="nid-input"
                value={googleNationalId}
                onChange={(e) => setGoogleNationalId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGoogleNidSubmit()}
              />

              <button className="nid-submit" onClick={handleGoogleNidSubmit}>
                {t("confirm")}
              </button>

              <button className="nid-close" onClick={() => setShowNidModal(false)}>
                {t("close")}
              </button>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default Register;


