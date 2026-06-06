import PROFILE from "./PROFILE.jpeg";
import React from "react";
import "./GradProfile.css";
import { useTranslation } from "react-i18next";

function GraduatedProfileView({ user }) {
  const { t } = useTranslation();
  if (!user) return <p>{t("No profile data found")}</p>;

  return (
    <div>
      <h1 className="h1">{t("Profile")}</h1>

      <div className="profile-card">
        <img
          src={user.profilePicture || PROFILE}
          alt="Profile"
          className="profile-img"
        />
        <h2>{user.fullName || "No Name"}</h2>

        <p><strong>{t("Faculty")}:</strong> {user.faculty || "Not provided"}</p>
        <p><strong>{t("Graduation Year")}:</strong> {user.graduationYear}</p>
        <p><strong>{t("Phone Number")}:</strong> {user.phoneNumber || "noPhone"}</p>
        <p><strong>{t("Bio")}:</strong> {user.bio || t("No bio")}</p>
        <p>
          <strong>CV:</strong>{" "}
          {user.CV ? (
            <a href={user.CV} download="My_CV">
              {t("Download CV")}
            </a>
          ) : (
            t("No CV uploaded")
          )}
        </p>
        <p>
          <strong>{t("Skills")}:</strong>{" "}
          {user.skills ? user.skills : t("No skills")}
        </p>
        <p><strong>{t("Current Job")}:</strong> {user.currentJob || t("Not provided")}</p>
        {user.linkedInLink && (
          <p>
            <strong>{t("LinkedIn")}:</strong>{" "}
            <a href={user.linkedInLink} target="_blank" rel="noreferrer">
            {t("View Profile")}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default GraduatedProfileView;


