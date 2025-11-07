// Footer.jsx
import React from 'react';
import './Footer.css';
import { useTranslation } from 'react-i18next';
import { FaFacebookF, FaInstagram, FaYoutube, FaTwitter, FaLinkedinIn } from 'react-icons/fa';
import {
  Mail,
  Phone,
  MapPin,
  Printer
} from 'lucide-react';

const Footer = React.forwardRef((props, ref) => {
  const { t } = useTranslation();

  return (
    <footer ref={ref} className="footer">
      <div className="footer-grid">
        <div>
          <h4 style={{color:"rgb(51, 49, 49)"}}>{t("alumniAffairsOffice")}</h4>
          <p>{t("contactUs")}</p>
          <div className="social-icons">
            <a href="https://www.facebook.com/helwan.edu.eg1" target="_blank" rel="noopener noreferrer">
              <FaFacebookF />
            </a>
            <a href="https://www.instagram.com/helwan_un/" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
            <a href="https://www.youtube.com/@Helwan.University" target="_blank" rel="noopener noreferrer">
              <FaYoutube />
            </a>
            <a href="https://x.com/Helwan_Un?s=20" target="_blank" rel="noopener noreferrer">
  <FaTwitter />
</a>

            <a href="https://www.linkedin.com/in/%D8%AC%D8%A7%D9%85%D8%B9%D8%A9-%D8%AD%D9%84%D9%88%D8%A7%D9%86-helwan-uni/" target="_blank" rel="noopener noreferrer">
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        <div>
          {/* <h4>{t("email")}</h4> */}
          <p><Mail size={16} /> President@helwan.edu.eg</p>
          {/* <p><Mail size={16} /> alumniportalhelwan@gmail.com</p> */}
        </div>
        <div>
        {/* <h4>{t("fax")}:</h4> */}
        <p><Printer size={16} /> 28162061</p>
        </div>

        <div>
          {/* <h4>{t("phone")}</h4> */}
          <p><Phone size={16} /> 28162061</p>
          <p><Phone size={16} /> 28162062</p>
         
        </div>
        
        {/* <div>
          <h4>{t("address")}</h4>
          <p><MapPin size={16} /> V888+FF3، السكة الحديد الغربية، المساكن الإقتصادية، قسم حلوان، محافظة القاهرة‬ 4034572</p>
        </div> */}
      </div>
    </footer>
  );
});

export default Footer;
