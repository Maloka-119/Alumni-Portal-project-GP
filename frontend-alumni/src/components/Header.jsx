import React, { useState } from 'react';
import UniLogo from './Uni Logo.jpeg';
import './Header.css';
import { Globe, LogIn } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Header = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState("EN");

  const toggleLanguage = () => {
    if (language === "EN") {
      setLanguage("AR");
      i18n.changeLanguage("ar");   
    } else {
      setLanguage("EN");
      i18n.changeLanguage("en");
    }
  };

  return (
    <header className="page-header">
      <div className="header-left">
        <img src={UniLogo} alt="University Logo" className="logo-placeholder" />
        <h1 className="portal-name">Helwan ALUMNI Portal</h1>
      </div>
      <div className="header-right">
        <button className="lang-btn" onClick={toggleLanguage}>
          <Globe size={20} style={{ marginRight: '6px' }} />
          {language}
        </button>
        <button
          className="login-btn"
          onClick={() => navigate("/login")}
        >
          <LogIn size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
