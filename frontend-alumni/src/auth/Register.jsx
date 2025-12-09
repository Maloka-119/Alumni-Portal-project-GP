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
import NewBg from '../Newbg.jpg'

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
      title: "Passwords do not match",
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
        title: "Registration Successful",
        text: "You can now login.",
        timer: 2000,
        showConfirmButton: false
      });
      setTimeout(() => navigate("/helwan-alumni-portal/login"), 2000);
    } 
    else {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: response.data.message || "Something went wrong"
      });
    }
  } 
  
  catch (err) {
    let message = "Something went wrong";

    if (err.response) {
      const data = err.response.data;

      // === Validation array from backend ===
      if (data?.details && Array.isArray(data.details)) {
        const friendlyMessages = data.details.map(d => {
          let text = d.replace(/"/g, "");

          // 🔐 SQL Injection detected (any field)
          if (/potential SQL injection/i.test(text)) {
            text = "Your input contains invalid characters. Please avoid using characters like ' ; --";
          }

          // 🚨 XSS detected (any field)
          else if (/potential XSS attack/i.test(text)) {
            text = "Your input contains forbidden HTML/script characters. Please remove any < > or similar content.";
          }

          // Email invalid
          else if (/email must be a valid email/i.test(text)) {
            text = "Please enter a valid email address.";
          }

          // Password validations
          else if (/password length must be at least/i.test(text)) {
            text = "Password must be at least 8 characters long.";
          }
          else if (/fails to match the number pattern/i.test(text)) {
            text = "Password must contain at least one number.";
          }
          else if (/fails to match the symbol pattern/i.test(text)) {
            text = "Password must contain at least one symbol.";
          }
          else if (/fails to match the uppercase pattern/i.test(text)) {
            text = "Password must contain at least one uppercase letter.";
          }
          else if (/fails to match the lowercase pattern/i.test(text)) {
            text = "Password must contain at least one lowercase letter.";
          }

          // National ID formatting
          text = text.replace(/nationalId/gi, "National ID");

          return "• " + text;
        });

        message = friendlyMessages.join("<br/>");
      }

      // === Duplicate email ===
      else if (data?.error === "Email already registered") {
        message = "This email is already registered. Try logging in.";
      }

      // === Duplicate National ID ===
      else if (data?.error === "NID already registered") {
        message = "This National ID is already registered.";
      }

      // === Other backend errors ===
      else if (data?.error) {
        message = data.error;
      }
      else if (data?.message) {
        message = data.message;
      }
    }

    else if (err.request) {
      message = "No response from server. Please check your connection.";
    }

    else {
      message = err.message;
    }

    Swal.fire({
      icon: "error",
      title: "Error",
      html: message
    });
  } 
  
  finally {
    setLoading(false);
  }
};



  const handleGoogleNidSubmit = () => {
    if (!googleNationalId.trim()) {
      Swal.fire({
        icon: "warning",
        title: "ادخلي الرقم القومي",
      });
      return;
    }

    startGoogleFlow();
  };
  const startGoogleFlow = () => {
    window.open(
      `http://localhost:5005/alumni-portal/auth/google?nationalId=${googleNationalId}`,
      "_self"
    );
  }
  return (
    // <div className="recontainer" style={{ backgroundImage: `url(${Unibackground})` }}>
     <div className="recontainer" style={{ backgroundImage: `url(${NewBg})` }}>

      <Header />

      <div className="wrapper">
        <div className="form-container">

          <form onSubmit={handleSubmit}>
            <h2 className="main-title">{t("createAccount")}</h2>
            {/* <p className="subtitle">{t("helwan")}</p> */}
            <p className="subtitle">{t("capitalUniversity")}</p>
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

            <p
 className="dont-have-account"
  onClick={() => navigate("/helwan-alumni-portal/login")}
>
  {t("alreadyHaveAccount")}
</p>

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
              <h3>{t("Enter Your National Id")}</h3>

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



