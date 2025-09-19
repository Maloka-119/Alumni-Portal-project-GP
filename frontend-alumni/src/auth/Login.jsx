import { useState } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../components/Header.css';
import '../components/Footer.css';
import Unibackground from './Unibackground.jpeg';
import { useTranslation } from "react-i18next";
import './Login.css';
import API from "../services/api"; 
import { useNavigate } from 'react-router-dom';


function Login() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [newPass, setNewPass] = useState("");
  const navigate = useNavigate();


  
  const handleLogin = async () => {
    try {
      const res = await API.post("/login", { email, password });
   const { id, email: userEmail, userType, token } = res.data;

    const user = { id, email: userEmail, userType };


     
  
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
  
      alert(t("loginSuccess"));
  
      
      if(user.userType === "admin") {
        navigate("/helwan-alumni-portal/admin/dashboard", { replace: true });
      } else if(user.userType === "graduate") {
        navigate("/helwan-alumni-portal/alumni/dashboard", { replace: true });
      } else {
        navigate("/helwan-alumni-portal/login", { replace: true }); 
      }
  
    } catch (err) {
      console.error("Login failed:", err);
      alert(t("loginFailed") + ": " + (err.response?.data?.message || err.message));
    }
  };
  

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/forgot-password", { email });
      alert(t("resetCodeSent"));
      setShowReset(false);
      setShowCode(true);
    } catch (err) {
      console.error("Forgot password failed:", err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      // هنا غالبا السيرفر مش محتاج API منفصل للتحقق من الكود
      // لكن هنمشى على إن reset بيأخذ code و password
      setShowCode(false);
      setShowNewPass(true);
    } catch (err) {
      console.error("Code verification failed:", err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleNewPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/reset-password", {
        email,
        code,
        newPassword: newPass,
      });
      alert(t("passwordResetSuccess"));
      setShowNewPass(false);
    } catch (err) {
      console.error("Reset password failed:", err);
      alert(err.response?.data?.message || err.message);
    }
  };
  
  

  return (
    <div className="login-container" style={{ backgroundImage: `url(${Unibackground})` }}>
      <Header />
      
      <div className="login-content">
        
        <h1 className="login-title">{t("welcomePortal")}</h1>
        <h4 className="login-subtitle">{t("helwanUniversity")}</h4>
        
        <div className="login-form-container">
          <form className="login-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label className="form-label">{t("email")}</label>
              <input
                placeholder={t("enterYourEmail")}
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">{t("password")}</label>
              <input
                className="form-input"
                required
                placeholder={t("enterYourPassword")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button type="button" className="login-button" onClick={handleLogin}>
              {t("signIn")}
            </button>
            
            <p className="forgot-link" onClick={() => setShowReset(true)}>
              {t("forgotPassword")}
            </p>
          </form>
        </div>
        
        {/* Reset Password Modal */}
        {showReset && (
          <div className="modal-overlay">
            <div className="reset-modal">
              <form onSubmit={handleResetPassword}>
                <h3 className="reset-title">{t("resetPassword")}</h3>
                
                <div className="form-group">
                  <label className="form-label">{t("email")}</label>
                  <input
                    required
                    placeholder={t("enterYourEmail")}
                    className="form-input"
                    type="email"
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

        {showCode && (
          <div className="modal-overlay">
            <div className="reset-modal">
              <form onSubmit={handleCodeSubmit}>
                <h3 className="reset-title">{t("verificationCode")}</h3>
                
                <div className="form-group">
                  <label className="form-label">{t("enterCode")}</label>
                  <input
                    className="form-input"
                    required
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

        {showNewPass && (
          <div className="modal-overlay">
            <div className="reset-modal">
            <form onSubmit={handleNewPassword}>
  <h3 className="reset-title">{t("setNewPassword")}</h3>
  
  <div className="form-group">
    <label className="form-label">{t("newPassword")}</label>
    <input
      className="form-input"
      required
      placeholder={t("enterNewPassword")}
      type="password"
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
      
      <Footer />
    </div>
  );
}

export default Login;



