import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import GoogleLoginButton from "../components/GoogleLoginButton";
import LinkedInLoginButton from "../components/LinkedInLoginButton";
import Unibackground from "./Unibackground.jpeg";
import { useTranslation } from "react-i18next";
import API from "../services/api";
import Swal from "sweetalert2";
import "../components/Header.css";
import "../components/Footer.css";
import "./Login.css";
import NewBg from '../Newbg.jpg'
import { FiEye, FiEyeOff } from "react-icons/fi";


function Login({ setUser }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");

  // =====================
  // التعامل مع Google OAuth بعد redirect + عرض رسائل الخطأ
  // =====================
useEffect(() => {
  const params = new URLSearchParams(location.search);

  // Show error messages
  const errorMessage = params.get("error");
  if (errorMessage) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: decodeURIComponent(errorMessage),
      timer: 5000,
    });
  }

  // Request National ID for first-time OAuth login (Google or LinkedIn)
  const requireNid = params.get("require_nid");
  const provider = params.get("provider") || "google"; // Default to google for backward compatibility
  if (requireNid === "true") {
    Swal.fire({
      icon: "info",
      title: "First time signing in with this email?",
      text: "Please enter your Egyptian National ID to activate your account",
      input: "text",
      inputPlaceholder: "Enter your 14-digit National ID",
      inputAttributes: { maxLength: 14, inputmode: "numeric" },
      showCancelButton: true,
      confirmButtonText: "Continue",
      cancelButtonText: "Cancel",
      preConfirm: (nid) => {
        if (!nid || nid.length !== 14 || !/^\d+$/.test(nid)) {
          Swal.showValidationMessage("National ID must be exactly 14 digits");
        }
        return nid;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const nationalId = result.value;
        if (provider === "linkedin") {
          // For LinkedIn, get auth URL with National ID
          fetch(`http://localhost:5005/alumni-portal/auth/linkedin?nationalId=${nationalId}`)
            .then(res => res.json())
            .then(data => {
              if (data.status === "success" && data.data?.authUrl) {
                window.location.href = data.data.authUrl;
              } else {
                Swal.fire({
                  icon: "error",
                  title: "Error",
                  text: "Failed to get LinkedIn authentication URL. Please try again.",
                });
              }
            })
            .catch(err => {
              console.error("LinkedIn auth URL error:", err);
              Swal.fire({
                icon: "error",
                title: "Error",
                text: "An error occurred. Please try again.",
              });
            });
        } else {
          // For Google
          window.location.href = `http://localhost:5005/alumni-portal/auth/google?nationalId=${nationalId}`;
        }
      }
    });
  }

  // Successful login handling
  const token = params.get("token");
  const id = params.get("id");
  const emailParam = params.get("email");
  const userType = params.get("userType");

  if (token && id && emailParam && userType) {
    const user = { id, email: emailParam, userType };
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    if (userType === "admin") {
      navigate("/helwan-alumni-portal/admin/dashboard", { replace: true });
    } else if (userType === "graduate") {
      navigate("/helwan-alumni-portal/graduate/dashboard", { replace: true });
    } else if (userType === "staff") {
      navigate("/helwan-alumni-portal/staff/dashboard", { replace: true });
    }
  }
}, [location.search, navigate, setUser]);
  // =====================
  // تسجيل الدخول التقليدي
  // =====================
const handleLogin = async () => {
  try {
    const res = await API.post("/login", { email, password });
    // console.log("Login Response Data:", res.data);
    const { id, email: userEmail, userType, token } = res.data;

    const user = { id, email: userEmail, userType };
    localStorage.clear();
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    Swal.fire({
      icon: "success",
      title: t("loginSuccess"),
      showConfirmButton: false,
      timer: 1500,
    });

    if (userType === "admin") {
      navigate("/helwan-alumni-portal/admin/dashboard", { replace: true });
    } else if (userType === "graduate") {
      navigate("/helwan-alumni-portal/graduate/dashboard", { replace: true });
    } else if (userType === "staff") {
      navigate("/helwan-alumni-portal/staff/dashboard", { replace: true });
    }

  } catch (err) {
    let message = "Something went wrong";

    if (err.response) {
      const data = err.response.data;

      // Invalid credentials
      if (data?.error === "Invalid credentials") {
        message = "• The email or password you entered is incorrect. Please try again.";
      }

      // Validation errors array
      else if (data?.details && Array.isArray(data.details)) {
        const friendlyMessages = data.details.map(d => {
          let text = d.replace(/"/g, "");

          // General input validation (SQL injection)
          if (/potential SQL injection/i.test(text)) {
            text = "• Your input contains invalid characters. Please avoid using characters like ' ; --";
          }

          // General input validation (XSS attack)
          else if (/potential XSS attack/i.test(text)) {
            text = "• Your input contains forbidden characters like < > or scripts. Please remove them.";
          }

          // Email invalid
          else if (/email must be a valid email/i.test(text)) {
            text = "• Please enter a valid email address.";
          }

          // Password invalid format
          else if (/password must be/i.test(text)) {
            text = "• Your password does not meet the required format.";
          }

          return text;
        });

        message = friendlyMessages.join("<br/>");
      }

      // Generic backend error
      else if (data?.error) {
        message = "• " + data.error;
      }

      else if (data?.message) {
        message = "• " + data.message;
      }

    }
    else if (err.request) {
      message = "• No response from server. Please check your internet connection.";
    }
    else {
      message = "• " + err.message;
    }

    Swal.fire({
      icon: "error",
      title: t("loginFailed"),
      html: message,
    });
  }
};



  // =====================
  // إرسال رمز إعادة تعيين كلمة المرور
  // =====================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await API.post("/forgot-password", { email });
      Swal.fire({
        icon: "info",
        title: t("resetCodeSent"),
        showConfirmButton: false,
        timer: 2000,
      });
      setShowReset(false);
      setShowCode(true);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t("loginFailed"),
        text: err.response?.data?.message || err.message,
      });
    }
  };

  // =====================
  // تأكيد الكود
  // =====================
  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setShowCode(false);
    setShowNewPass(true);
  };

  // =====================
  // تعيين كلمة المرور الجديدة
  // =====================
  const handleNewPassword = async (e) => {
    e.preventDefault();
    try {
      await API.post("/reset-password", {
        email,
        code,
        newPassword: newPass,
      });
      Swal.fire({
        icon: "success",
        title: t("passwordResetSuccess"),
        showConfirmButton: false,
        timer: 2000,
      });
      setShowNewPass(false);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: t("loginFailed"),
        text: err.response?.data?.message || err.message,
      });
    }
  };

const handleGoogleLogin = async () => {
  try {
    // فتح صفحة Google login
    window.open("http://localhost:5005/alumni-portal/auth/google", "_self");
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "Something went wrong"
    });
  }
};

const handleLinkedInLogin = async () => {
  try {
    console.log("Initiating LinkedIn login (no National ID required for existing users)");
    
    // Get LinkedIn auth URL without National ID (for login)
    const res = await fetch(`http://localhost:5005/alumni-portal/auth/linkedin`);
    const data = await res.json();

    console.log("LinkedIn login auth URL response:", data);

    if (data.status === "success" && data.data?.authUrl) {
      console.log("Redirecting to LinkedIn for login:", data.data.authUrl);
      // Clear any existing tokens to ensure fresh login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to LinkedIn OAuth
      window.location.href = data.data.authUrl;
    } else {
      console.error("LinkedIn login auth URL request failed:", data);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to get LinkedIn authentication URL. Please try again.",
      });
    }
  } catch (err) {
    console.error("LinkedIn login error:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "An error occurred while connecting to LinkedIn. Please try again."
    });
  }
};


  return (
    // <div className="login-container" style={{ backgroundImage: `url(${Unibackground})` }}>
     <div className="login-container" style={{ backgroundImage: `url(${NewBg})` }}>

      <Header />

      <div className="wrapperr">
        <div className="login-content">
          <h1 className="login-title">{t("welcomePortal")}</h1>
          {/* <h4 className="login-subtitle">{t("helwanUniversity")}</h4> */}
          <h4 className="login-subtitle">{t("capitalUniversity")}</h4>


          <div className="login-form-container">
            <form className="login-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label className="form-label">{t("email")}</label>
                <input
                  placeholder={t("enterYourEmail")}
                  className="form-inputre"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("password")}</label>
                <div className="password-field">
  <input
    type={showPassword ? "text" : "password"}
    className="form-input"
    placeholder={t("enterYourPassword")}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />

  <span
    className="eye-icon"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <FiEyeOff /> : <FiEye />}
  </span>
</div>



              </div>

              <button type="button" className="login-button" onClick={handleLogin}>
                {t("signIn")}
              </button>

              <p className="forgot-link" onClick={() => setShowReset(true)}>
                {t("forgotPassword")}
              </p>

              <p className="dont-have-account" onClick={() => navigate("/helwan-alumni-portal/register")}>
                {t("dontHaveAccount")}
              </p>
            </form>
            <hr className="form-divider" />
            {/* زر LinkedIn login تحت الفورم */}
            <LinkedInLoginButton
              onClick={handleLinkedInLogin}
              text={t("signInWithLinkedIn") || "Sign in with LinkedIn"}
            />
            {/* زر Google login تحت الفورم */}
            <GoogleLoginButton
              onClick={handleGoogleLogin}
              text={t("signInWithGoogle")}
            />
          </div>

          {/* RESET MODALS */}
          {showReset && (
            <div className="modal-overlay">
              <div className="reset-modal">
                <form onSubmit={handleResetPassword}>
                  <h3 className="reset-title">{t("resetPassword")}</h3>
                  <div className="form-group">
                    <label className="form-label">{t("email")}</label>
                    <input
                      required
                      type="email"
                      className="form-input"
                      placeholder={t("enterYourEmail")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="modal-buttons">
                    <button type="button" className="modal-button cancel" onClick={() => setShowReset(false)}>
                      {t("cancel")}
                    </button>
                    <button type="submit" className="modal-button primary">{t("resetPassword")}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showCode && (
            <div className="modal-overlay">
              <div className="reset-modal">
                <form onSubmit={handleCodeSubmit}>
                  <h3 className="reset-title">{t("verificationCode")}</h3>
                  <div className="form-group">
                    <label className="form-label">{t("enterCode")}</label>
                    <input
                      required
                      className="form-input"
                      placeholder={t("enterCodePlaceholder")}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                  <div className="modal-buttons">
                    <button type="button" className="modal-button cancel" onClick={() => setShowCode(false)}>
                      {t("cancel")}
                    </button>
                    <button type="submit" className="modal-button primary">{t("submit")}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showNewPass && (
            <div className="modal-overlay">
              <div className="reset-modal">
                <form onSubmit={handleNewPassword}>
                  <h3 className="reset-title">{t("setNewPassword")}</h3>
                  <div className="form-group">
                    <label className="form-label">{t("newPassword")}</label>
                    <input
                      required
                      type="password"
                      className="form-input"
                      placeholder={t("enterNewPassword")}
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                    />
                  </div>
                  <div className="modal-buttons">
                    <button type="submit" className="modal-button primary">{t("resetPassword")}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Login;
