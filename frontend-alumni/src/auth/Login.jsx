import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../components/Header.css";
import "../components/Footer.css";
import Unibackground from "./Unibackground.jpeg";
import { useTranslation } from "react-i18next";
import "./Login.css";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function Login({ setUser }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showReset, setShowReset] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");

  // -----------------------
  // LOGIN
  // -----------------------
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

      if (user.userType === "admin") {
        navigate("/helwan-alumni-portal/admin/dashboard", { replace: true });
      } else if (user.userType === "graduate") {
        navigate("/helwan-alumni-portal/graduate/dashboard", { replace: true });
      } else if (user.userType === "staff") {
        navigate("/helwan-alumni-portal/staff/dashboard", { replace: true });
      } else {
        navigate("/helwan-alumni-portal/login", { replace: true });
      }
    } 
catch (err) {
  Swal.fire({
    icon: "error",
    title: t("loginFailed"),
    text: err.response?.data?.error || err.response?.data?.message || err.message,
  });
}

  };

  // -----------------------
  // SEND RESET CODE
  // -----------------------
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
      console.error("Forgot password failed:", err);
      Swal.fire({
        icon: "error",
        title: t("loginFailed"),
        text: err.response?.data?.message || err.message,
      });
    }
  };

  // -----------------------
  // CONFIRM CODE
  // -----------------------
  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setShowCode(false);
    setShowNewPass(true);
  };

  // -----------------------
  // SET NEW PASSWORD
  // -----------------------
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
      console.error("Reset password failed:", err);
      Swal.fire({
        icon: "error",
        title: t("loginFailed"),
        text: err.response?.data?.message || err.message,
      });
    }
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${Unibackground})` }}
    >
      <Header />

      <div className="wrapperr">
        <div className="login-content">
          <h1 className="login-title">{t("welcomePortal")}</h1>
          <h4 className="login-subtitle">{t("helwanUniversity")}</h4>

          <div className="login-form-container">
            <form className="login-form" onSubmit={(e) => e.preventDefault()}>
              {/* EMAIL */}
              <div className="form-group">
                <label className="form-label">{t("email")}</label>
                <input
                  placeholder={t("enterYourEmail")}
                  className="form-inputre"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <label className="form-label">{t("password")}</label>
                <input
                  className="form-inputre"
                  required
                  autoComplete="current-password"
                  placeholder={t("enterYourPassword")}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* LOGIN BUTTON */}
              <button type="button" className="login-button" onClick={handleLogin}>
                {t("signIn")}
              </button>

              {/* RESET PASSWORD */}
              <p className="forgot-link" onClick={() => setShowReset(true)}>
                {t("forgotPassword")}
              </p>

              {/* REGISTER */}
              <p
                className="dont-have-account"
                onClick={() =>
                  navigate("/helwan-alumni-portal/register")
                }
              >
                {t("dontHaveAccount")}
              </p>
            </form>
          </div>

          {/* -----------------------
              RESET MODAL
          ----------------------- */}
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
                    <button
                      type="button"
                      className="modal-button cancel"
                      onClick={() => setShowReset(false)}
                    >
                      {t("cancel")}
                    </button>
                    <button type="submit" className="modal-button primary">
                      {t("resetPassword")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* -----------------------
              CODE MODAL
          ----------------------- */}
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
                    <button
                      type="button"
                      className="modal-button cancel"
                      onClick={() => setShowCode(false)}
                    >
                      {t("cancel")}
                    </button>
                    <button type="submit" className="modal-button primary">
                      {t("submit")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* -----------------------
              NEW PASSWORD MODAL
          ----------------------- */}
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
                    <button type="submit" className="modal-button primary">
                      {t("resetPassword")}
                    </button>
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


