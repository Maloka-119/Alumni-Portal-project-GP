import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../services/api";
import "./PublicGraduateProfile.css"

function PublicGraduateProfile() {
  const { graduationId } = useParams();
  const [graduate, setGraduate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraduate = async () => {
      try {
        const res = await API.get(`/graduates/${graduationId}/public-profile`);
        setGraduate(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchGraduate();
  }, [graduationId]);
  
  if (loading) return <p>Loading...</p>;
  if (!graduate) return <p>Graduate not found</p>;

  return (
    <div className="pgp-page">
      {/* جملة تعريفية قبل الكارت */}
      <div className="pgp-intro">
        <h1>Welcome to the Helwan Alumni Public Profile</h1>
        <p>مرحبا بكم في صفحة التعريف العامة لخريجي جامعة حلوان</p>
        <p>هنا يمكنك عرض معلومات الخريج بشكل رسمي وموثق</p>
      </div>

      <div className="pgp-container">
        <div className="pgp-image-section">
          {graduate.image ? (
            <img src={graduate.image} alt={graduate.fullName} className="pgp-image"/>
          ) : (
            <div className="pgp-placeholder">No Image</div>
          )}
        </div>
        <div className="pgp-name-section">
          <h2 className="pgp-name-eng">{graduate.fullName}</h2>
          {/* <h3 className="pgp-name-ar">{graduate.fullNameArabic || "-"}</h3> */}
          {/* <p className="pgp-id-number">{graduate.idNumber || "-"}</p> */}
        </div>
        <div className="pgp-details">
          <p><strong>Faculty:</strong> {graduate.faculty || "-"}</p>
          <p><strong>Department:</strong> {graduate.department || "-"}</p>
          <p><strong>Graduation Year:</strong> {graduate.graduationYear || "-"}</p>
        </div>
      </div>
    </div>
  );
}

export default PublicGraduateProfile;
