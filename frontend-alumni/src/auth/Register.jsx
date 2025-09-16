import React, { useState } from 'react';
import './Register.css';
import Unibackground from './Unibackground.jpeg';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LinkedInSignUp from './LinkedInSignUp';
import { useTranslation } from "react-i18next";
import API from "../services/api"; 

const Register = () => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    nationalId: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setMessage(t("passwordsNotMatch", { defaultValue: "Passwords do not match" }));
      setLoading(false);
      return;
    }

    try {
      const response = await API.post("/register", formData); 

      if (response.status === 201 || response.status === 200) {
        const data = response.data;
        setMessage(t("registrationSuccess", { defaultValue: "Registration successful" }));
        console.log("✅ Backend response:", data);
      } else {
        setMessage(response.data.message || t("registrationFailed", { defaultValue: "Registration failed" }));
      }
    } catch (error) {
      console.error("❌ Error:", error);
      setMessage(t("somethingWrong", { defaultValue: "Something went wrong" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ backgroundImage: `url(${Unibackground})` }}>
      <Header />

      <div className="wrapper">
        <form className="form-container" onSubmit={handleSubmit}>
          <h2 className="main-title">{t("createAccount")}</h2>
          <p className="subtitle">{t("helwan")}</p><br />

          <div className="form-grid">
            {[
              { name: "nationalId", type: "text" },
              { name: "email", type: "email" },
              { name: "firstName", type: "text" },
              { name: "lastName", type: "text" },
              { name: "password", type: "password" },
              { name: "confirmPassword", type: "password" },
              { name: "phoneNumber", type: "tel" },
              { name: "dateOfBirth", type: "date" }
            ].map(field => (
              <div className="form-group" key={field.name}>
                <label className="form-label">{t(field.name)}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            ))}
          </div>

          <div className="submit-section">
            <button
              type="submit"
              className="register-btn"
              disabled={loading}
            >
              {loading ? t("registering") : t("register")}
            </button>
          </div>

          {message && <p className="message">{message}</p>}

          <LinkedInSignUp />
        </form>

        <Footer />
      </div>
    </div>
  );
};

export default Register;



// import React, { useState } from 'react';
// import './Register.css';
// import Unibackground from './Unibackground.jpeg';
// import Header from '../components/Header';
// import Footer from '../components/Footer';
// import LinkedInSignUp from './LinkedInSignUp';
// import { useTranslation } from "react-i18next";

// const Register = () => {
//   const { t } = useTranslation();

//   const [formData, setFormData] = useState({
//     nationalId: '',
//     firstName: '',
//     lastName: '',
//     password: '',
//     confirmPassword: '',
//     email: '',
//     phoneNumber: '',
//     dateOfBirth: ''
//   });

//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');

//   const API_URL = "http://localhost:5000/api/register";

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage('');

//     if (formData.password !== formData.confirmPassword) {
//       setMessage(t("passwordsNotMatch", { defaultValue: "Passwords do not match" }));
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await fetch(API_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formData)
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setMessage(t("registrationSuccess", { defaultValue: "Registration successful" }));
//         console.log("✅ Backend response:", data);
//       } else {
//         const errorData = await response.json();
//         setMessage(errorData.message || t("registrationFailed", { defaultValue: "Registration failed" }));
//       }
//     } catch (error) {
//       console.error("❌ Error:", error);
//       setMessage(t("somethingWrong", { defaultValue: "Something went wrong" }));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container" style={{ backgroundImage: `url(${Unibackground})` }}>
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
//               { name: "phoneNumber", type: "tel" },
//               { name: "dateOfBirth", type: "date" }
//             ].map(field => (
//               <div className="form-group" key={field.name}>
//                 <label className="form-label">{t(field.name)}</label>
//                 <input
//                   type={field.type}
//                   name={field.name}
//                   value={formData[field.name]}
//                   onChange={handleInputChange}
//                   className="form-input"
//                 />
//               </div>
//             ))}
//           </div>

//           <div className="submit-section">
//             <button
//               type="submit"
//               className="register-btn"
//               disabled={loading}
//             >
//               {loading ? t("registering") : t("register")}
//             </button>
//           </div>

//           {message && <p className="message">{message}</p>}

//           <LinkedInSignUp />
//         </form>

//         <Footer />
//       </div>
//     </div>
//   );
// };

// export default Register;
