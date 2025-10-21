import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './Register.css';
import Unibackground from './Unibackground.jpeg';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LinkedInSignUp from './LinkedInSignUp';
import { useTranslation } from "react-i18next";
import API from "../services/api"; 

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nationalId: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    email: '',
    phoneNumber: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 🕒 الرسالة تختفي بعد 5 ثواني تلقائيًا
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    if (formData.password !== formData.confirmPassword) {
      setMessage(t("passwordsNotMatch", { defaultValue: "Passwords do not match" }));
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const response = await API.post("/register", formData); 

      if (response.status === 201 || response.status === 200) {
        const data = response.data;
        setMessage(data.message || t("registrationSuccess", { defaultValue: "Registration successful" }));
        console.log("Backend response:", data);
        setTimeout(() => {
          navigate("/helwan-alumni-portal/login");
        }, 1500);
      } else {
        setIsError(true);
        setMessage(response.data.message || t("registrationFailed", { defaultValue: "Registration failed" }));
      }
    } catch (error) {
      console.error("Error:", error);
      setIsError(true);
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage(t("somethingWrong", { defaultValue: "Something went wrong" }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recontainer" style={{ backgroundImage: `url(${Unibackground})` }}>
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
              { name: "phoneNumber", type: "tel", className: "phone-center" },
            ].map(field => (
              <div className={`form-group ${field.className || ""}`} key={field.name}>
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

          {message && (
            <p className={`message ${isError ? "error" : "success"}`}>
              {message}
            </p>
          )}

          <LinkedInSignUp />
        </form>

        <Footer />
      </div>
    </div>
  );
};

export default Register;
