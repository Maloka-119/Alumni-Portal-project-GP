import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./GradProfile.css";
import PROFILE from "./PROFILE.jpeg";
import API from "../../services/api";

function GraduatedProfile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const { t } = useTranslation();

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  useEffect(() => {
    if (userId) fetchUser();
  }, [userId]);

  // دالة لتوحيد بيانات المستخدم بعد GET أو PUT
  const normalizeData = (data) => ({
    profilePicture: data.profilePicture || data["profile-picture-url"] || PROFILE,
    fullName:
      data.fullName ||
      `${data.User?.["first-name"] || ""} ${data.User?.["last-name"] || ""}`,
    faculty: data.faculty,
    graduationYear: data.graduationYear || data["graduation-year"],
    bio: data.bio || "",
    CV: data.CV || data["cv-url"] || null,
    skills:
      typeof data.skills === "string"
        ? JSON.parse(data.skills || "[]")
        : data.skills || [],
    currentJob: data.currentJob || data["current-job"] || "",
    phoneNumber: data.phoneNumber || data.User?.["phone-number"] || "",
  });

  const fetchUser = async () => {
    try {
      const res = await API.get(`/graduates/${userId}/profile`);
      const data = normalizeData(res.data.data);
      setUser(data);
      setFormData(data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSkillsChange = (e) => {
    setFormData({ ...formData, skills: e.target.value.split(",") });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData({ ...formData, profilePictureFile: file });
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData({ ...formData, cvFile: file });
  };

  const handleEdit = () => {
    if (user.fullName) {
      const parts = user.fullName.split(" ");
      setFormData({
        ...user,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
      });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = new FormData();
      payload.append("firstName", formData.firstName);
      payload.append("lastName", formData.lastName);
      payload.append("bio", formData.bio || "");
      payload.append("currentJob", formData.currentJob || "");
      payload.append("skills", JSON.stringify(formData.skills || []));
      payload.append("faculty", formData.faculty || "");
      payload.append("graduationYear", formData.graduationYear || "");
      payload.append("phoneNumber", formData.phoneNumber || "");

      if (formData.profilePictureFile)
        payload.append("profilePicture", formData.profilePictureFile);
      if (formData.cvFile) payload.append("cv", formData.cvFile);

      const res = await API.put("/graduates/profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedData = normalizeData(res.data.data.graduate || res.data.data);
      setUser(updatedData);
      setFormData(updatedData);
      setEditing(false);
    } catch (err) {
      console.error(
        "Failed to update user:",
        err.response?.data || err.message
      );
    }
  };

  const handleCancel = () => {
    setFormData(user);
    setEditing(false);
  };

  if (!user || !formData) return <p>{t("loading")}</p>;

  const fullName =
    formData.fullName || `${formData.firstName || ""} ${formData.lastName || ""}`;

  return (
    <div className="profile-page">
      <h1 className="uni-header">{t("profile")}</h1>

      {!editing ? (
        <div className="profile-card">
          <img
            src={formData.profilePicture}
            alt="Profile"
            className="profile-img"
          />
          <h2>{fullName}</h2>
          <p>
            <strong>{t("faculty")}:</strong> {formData.faculty}
          </p>
          <p>
            <strong>{t("graduationYear")}:</strong> {formData.graduationYear}
          </p>
          <p>
            <strong>{t("bio")}:</strong> {formData.bio}
          </p>
          <p>
            <strong>{t("cv")}:</strong>{" "}
            {formData.CV ? (
              <a href={formData.CV} download>
                {t("downloadCv")}
              </a>
            ) : (
              t("noCv")
            )}
          </p>
          <p>
            <strong>{t("skills")}:</strong>{" "}
            {formData.skills.length > 0 ? formData.skills.join(", ") : t("noSkills")}
          </p>
          <p>
            <strong>{t("currentJob")}:</strong> {formData.currentJob}
          </p>
          <p>
            <strong>{t("phoneNumber")}:</strong>{" "}
            {formData.phoneNumber || t("noPhone")}
          </p>
          <button className="edit-btnn" onClick={handleEdit}>
            {t("updateInfo")}
          </button>
        </div>
      ) : (
        <div className="info">
          <label>
            {t("firstName")}:
            <input
              type="text"
              name="firstName"
              value={formData.firstName || ""}
              onChange={handleChange}
            />
          </label>
          <label>
            {t("lastName")}:
            <input
              type="text"
              name="lastName"
              value={formData.lastName || ""}
              onChange={handleChange}
            />
          </label>
          <label>
            {t("faculty")}:
            <input type="text" name="faculty" value={formData.faculty} disabled />
          </label>
          <label>
            {t("graduationYear")}:
            <input
              type="text"
              name="graduationYear"
              value={formData.graduationYear}
              disabled
            />
          </label>
          <label>
            {t("bio")}:
            <textarea name="bio" value={formData.bio} onChange={handleChange} />
          </label>
          <label>
            {t("skills")}:
            <input
              type="text"
              name="skills"
              value={formData.skills.join(",")}
              onChange={handleSkillsChange}
            />
          </label>
          <label>
            {t("currentJob")}:
            <input
              type="text"
              name="currentJob"
              value={formData.currentJob}
              onChange={handleChange}
            />
          </label>
          <label>
            {t("profilePhoto")}:
            <input
              className="file-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </label>
          <label>
            {t("cv")}:
            <input
              className="file-input"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvChange}
            />
          </label>
          <label>
            {t("phoneNumber")}:
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber || ""}
              onChange={handleChange}
            />
          </label>

          <button onClick={handleSave}>{t("save")}</button>
          <button onClick={handleCancel}>{t("cancel")}</button>
        </div>
      )}
    </div>
  );
}

export default GraduatedProfile;



