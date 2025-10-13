import React from "react";
import { useTranslation } from "react-i18next";

const LinkedInSignUp = () => {
  const { t } = useTranslation();

  const clientId = "YOUR_CLIENT_ID";
  const redirectUri = "https://yourdomain.com/auth/linkedin/callback";
  const scope = "r_liteprofile r_emailaddress";

  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scope)}`;

  return (
    <div className="divider-section">
      <div className="divider">
        <div className="divider-line"></div>
        <span className="divider-text">{t("or")}</span>
        <div className="divider-line"></div>
      </div>
      <a href={linkedinAuthUrl} className="linkedin-btn">
        <svg className="linkedin-icon" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        {t("signUpWithLinkedIn")}
      </a>
    </div>
  );
};

export default LinkedInSignUp;
