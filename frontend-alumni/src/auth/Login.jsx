
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import GoogleLoginButton from "../components/GoogleLoginButton";
import Unibackground from "./Unibackground.jpeg";
import { useTranslation } from "react-i18next";
import API from "../services/api";
import Swal from "sweetalert2";
import "../components/Header.css";
import "../components/Footer.css";
import "./Login.css";

function Login({ setUser }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");

  // =====================
  // التعامل مع Google OAuth بعد redirect
  // =====================
  useEffect(() => {
    const params = new URLSearchParams(location.search);
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
      } else {
        navigate("/helwan-alumni-portal/login", { replace: true });
      }
    }
  }, [location.search, navigate, setUser]);

  // =====================
  // تسجيل الدخول التقليدي
  // =====================
  const handleLogin = async () => {
    try {
      const res = await API.post("/login", { email, password });
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
      Swal.fire({
        icon: "error",
        title: t("loginFailed"),
        text: err.response?.data?.message || err.message,
      });
    }
  };

  // =====================
  // إرسال رمز إعادة تعيين كلمة المرور
  // =====================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await API.post("/forgotpassword", { email });
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
      await API.post("/resetpassword", {
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

  return (
    <div className="login-container" style={{ backgroundImage: `url(${Unibackground})` }}>
      <Header />

      <div className="wrapperr">
        <div className="login-content">
          <h1 className="login-title">{t("welcomePortal")}</h1>
          <h4 className="login-subtitle">{t("helwanUniversity")}</h4>

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
                <input
                  className="form-inputre"
                  type="password"
                  placeholder={t("enterYourPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="button" className="login-button" onClick={handleLogin}>
                {t("signIn")}
              </button>

              <GoogleLoginButton />

              <p className="forgot-link" onClick={() => setShowReset(true)}>
                {t("forgotPassword")}
              </p>

              <p className="dont-have-account" onClick={() => navigate("/helwan-alumni-portal/register")}>
                {t("dontHaveAccount")}
              </p>
            </form>
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