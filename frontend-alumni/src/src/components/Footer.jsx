// Footer.jsx
import React from 'react';
import './Footer.css';
import { useTranslation } from 'react-i18next';

const Footer = React.forwardRef((props, ref) => {
  const { t } = useTranslation();

  return (
    <footer ref={ref} className="footer">
      <div className="footer-grid">
        <div>
          <h4>{t("alumniAffairsOffice")}</h4>
          <p>{t("contactUs")}</p>
          <div className="social-icons">
            <a href="#" className="facebook">f</a>
            <a href="#" className="instagram">in</a>
            <a href="#" className="gmail">@</a>
            <a href="#" className="phone">ph</a>
          </div>
        </div>

        <div>
          <h4>{t("email")}</h4>
          <p>alumni@hq.helwan.edu.eg</p>
        </div>

        <div>
          <h4>{t("phone")}</h4>
          <p>+20 2 2558 1234</p>
        </div>

        <div>
          <h4>{t("workingHours")}</h4>
          <p>{t("workingHoursValue")}</p>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
