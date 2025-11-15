// import React from 'react';
// import './UserManagement.css';
// import { useTranslation } from "react-i18next";

// const UserManagement = ({ activeTabName }) => {
//   const { t } = useTranslation();

//   const title =
//     activeTabName === "Staff"
//       ? t("staffManagement")
//       : activeTabName === "Alumni"
//       ? t("alumniManagement")
//       : t("userManagement");

//   return (
//     <div className="USERmain-content">
//       <h1 className="page-title">{title}</h1>
//     </div>
//   );
// };

// export default UserManagement;

import React from 'react';
import './UserManagement.css';
import { useTranslation } from "react-i18next";

const UserManagement = ({ activeTabName }) => {
  const { t } = useTranslation();

  const title =
  activeTabName?.toLowerCase() === "staff"
    ? t("staffManagement")
    : activeTabName?.toLowerCase() === "alumni"
    ? t("alumniManagement")
    : activeTabName?.toLowerCase() === "requests"
    ? t("othersManagement")
    : t("userManagement");

  return (
    <div className="USERmain-content">
      <h1 className="page-title">{title}</h1>
    </div>
  );
};

export default UserManagement;
