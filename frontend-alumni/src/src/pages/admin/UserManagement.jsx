import React from 'react';
import './UserManagement.css';
import { useTranslation } from "react-i18next";

const UserManagement = ({ activeTabName }) => {
  const { t } = useTranslation();

  const tabs = [
    { key: "Alumni", label: t("alumni") },
    { key: "Staff", label: t("staff") }
  ];

  return (
    <div className="USERmain-content">
      <h1 className="page-title">{t("userManagement")}</h1>

      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-button ${activeTabName === tab.key ? 'active' : ''}`}
            disabled
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
