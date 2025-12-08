import React, { useState } from 'react';
import UniLogo from './logo-white-deskt-min.png';
import './Header.css';
import { Globe, LogIn,Home ,DoorOpen} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Header = () => {
  const navigate = useNavigate();
  const {t, i18n } = useTranslation();
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
        <img src={UniLogo} alt="University Logo" className="logoo-placeholder" />
        <h1 className="portal-name">Helwan ALUMNI Portal</h1>
      </div>
      <div className="header-right">
        <button className="lang-btn" onClick={toggleLanguage}>
          <Globe size={20} style={{ marginRight: '6px' }} />
          {language}
        </button>
        <button
  className="login-btn"
  title={t("move_to_landing")}
  onClick={() => navigate("/helwan-alumni-portal")}
>
  {/* <DoorOpen size={20} /> */}
  <Home size={20} />
</button>

      </div>
    </header>
  );
};

export default Header;
