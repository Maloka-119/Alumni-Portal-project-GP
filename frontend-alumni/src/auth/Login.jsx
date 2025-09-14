import { useState } from "react";
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../components/Header.css';
import '../components/Footer.css';
import Unibackground from './Unibackground.jpeg';
import { useTranslation } from "react-i18next";
import './Login.css';
import API from "../../services/api"; // استدعاء الـ API

function Login() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [newPass, setNewPass] = useState("");

  // الفانكشن الجديدة لتسجيل الدخول
  const handleLogin = async () => {
    try {
      const res = await API.post("/auth/login", { email, password });
      const token = res.data.token;
      localStorage.setItem("token", token);
      alert(t("loginSuccess"));
      // بعد كده ممكن تعمل Redirect للصفحة الرئيسية أو Profile
    } catch (err) {
      console.error("Login failed:", err);
      alert(t("loginFailed") + ": " + (err.response?.data?.message || err.message));
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setShowCode(true);
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setShowNewPass(true);
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
              <form>
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
                  <button className="modal-button primary">{t("resetPassword")}</button>
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




// import { useState } from "react";
// import Header from '../components/Header';
// import Footer from '../components/Footer';
// import '../components/Header.css';
// import '../components/Footer.css';
// import Unibackground from './Unibackground.jpeg'
// import { useTranslation } from "react-i18next";
// import './Login.css'

// function Login() {
//   const { t } = useTranslation();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showReset, setShowReset] = useState(false);
//   const [showCode, setShowCode] = useState(false);
//   const [code, setCode] = useState("");
//   const [showNewPass, setShowNewPass] = useState(false);
//   const [newPass, setNewPass] = useState("");

//   const handleResetPassword = (e) => {
//     e.preventDefault();
//     setShowCode(true);
//   };

//   const handleCodeSubmit = (e) => {
//     e.preventDefault();
//     setShowNewPass(true);
//   };

//   return (
//     <div className="login-container" style={{ backgroundImage: `url(${Unibackground})` }}>
//       <Header />
      
//       <div className="login-content">
        
//         <h1 className="login-title">{t("welcomePortal")}</h1>
//         <h4 className="login-subtitle">{t("helwanUniversity")}</h4>
        
//         <div className="login-form-container">
//           <form className="login-form">
//             <div className="form-group">
//               <label className="form-label">{t("email")}</label>
//               <input
//                 placeholder={t("enterYourEmail")}
//                 className="form-input"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />
//             </div>
            
//             <div className="form-group">
//               <label className="form-label">{t("password")}</label>
//               <input
//                 className="form-input"
//                 required
//                 placeholder={t("enterYourPassword")}
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               />
//             </div>
            
//             <button type="button" className="login-button">
//               {t("signIn")}
//             </button>
            
//             <p className="forgot-link" onClick={() => setShowReset(true)}>
//               {t("forgotPassword")}
//             </p>
//           </form>
//         </div>
        
//         {/* Reset Password Modal */}
//         {showReset && (
//           <div className="modal-overlay">
//             <div className="reset-modal">
//               <form onSubmit={handleResetPassword}>
//                 <h3 className="reset-title">{t("resetPassword")}</h3>
                
//                 <div className="form-group">
//                   <label className="form-label">{t("email")}</label>
//                   <input
//                     required
//                     placeholder={t("enterYourEmail")}
//                     className="form-input"
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                   />
//                 </div>
                
//                 <div className="modal-buttons">
//                   <button
//                     type="button"
//                     className="modal-button cancel"
//                     onClick={() => setShowReset(false)}
//                   >
//                     {t("cancel")}
//                   </button>
//                   <button type="submit" className="modal-button primary">
//                     {t("resetPassword")}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}

//         {showCode && (
//           <div className="modal-overlay">
//             <div className="reset-modal">
//               <form onSubmit={handleCodeSubmit}>
//                 <h3 className="reset-title">{t("verificationCode")}</h3>
                
//                 <div className="form-group">
//                   <label className="form-label">{t("enterCode")}</label>
//                   <input
//                     className="form-input"
//                     required
//                     placeholder={t("enterCodePlaceholder")}
//                     value={code}
//                     onChange={(e) => setCode(e.target.value)}
//                   />
//                 </div>
                
//                 <div className="modal-buttons">
//                   <button 
//                     type="button" 
//                     className="modal-button cancel" 
//                     onClick={() => setShowCode(false)}
//                   >
//                     {t("cancel")}
//                   </button>
//                   <button type="submit" className="modal-button primary">
//                     {t("submit")}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}

//         {showNewPass && (
//           <div className="modal-overlay">
//             <div className="reset-modal">
//               <form>
//                 <h3 className="reset-title">{t("setNewPassword")}</h3>
                
//                 <div className="form-group">
//                   <label className="form-label">{t("newPassword")}</label>
//                   <input
//                     className="form-input"
//                     required
//                     placeholder={t("enterNewPassword")}
//                     type="password"
//                     value={newPass}
//                     onChange={(e) => setNewPass(e.target.value)}
//                   />
//                 </div>
                
//                 <div className="modal-buttons">
//                   <button className="modal-button primary">{t("resetPassword")}</button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//       </div>
      
//       <Footer />
//     </div>
//   );
// }

// export default Login;
