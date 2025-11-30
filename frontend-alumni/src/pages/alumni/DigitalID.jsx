// import './DigitalId.css';
// import html2canvas from "html2canvas";
// import { useRef, useState, useEffect } from "react";
// import PROFILE from "./PROFILE.jpeg";
// import { useTranslation } from "react-i18next";
// import API from "../../services/api";
// import UniLogo from '../../components/logo-white-deskt-min.png';

// function DigitalID() {
//   const { t } = useTranslation();
//   const cardRef = useRef(null);
//   const [user, setUser] = useState(null);
//   const [imgSrc, setImgSrc] = useState(PROFILE); // الصورة النهائية للعرض والتحميل

//   // ------------------ جلب بيانات المستخدم ------------------
//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const token = localStorage.getItem("token"); 
//         const res = await API.get("/graduates/digital-id", {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         setUser(res.data.data);

//         // لو فيه صورة خارجية، نحولها لـ Base64
//         if (res.data.data.personalPicture) {
//           loadImageAsDataURL(res.data.data.personalPicture).then(setImgSrc);
//         }
//       } catch (err) {
//         console.error(err);
//       }
//     };

//     fetchUser();
//   }, []);

//   // ------------------ دالة تحويل الصورة لـ Base64 ------------------
//   const loadImageAsDataURL = async (url) => {
//     try {
//       const res = await fetch(url, { mode: "cors" });
//       const blob = await res.blob();
//       return new Promise((resolve) => {
//         const reader = new FileReader();
//         reader.onloadend = () => resolve(reader.result);
//         reader.readAsDataURL(blob);
//       });
//     } catch (err) {
//       console.warn("Failed to load image, using default:", err);
//       return PROFILE; // fallback
//     }
//   };

//   // ------------------ تنزيل الكارت كصورة ------------------
//   const handleDownload = () => {
//     if (!cardRef.current) return;
//     html2canvas(cardRef.current, { useCORS: true }).then((canvas) => {
//       const link = document.createElement("a");
//       link.download = "GraduateID.png";
//       link.href = canvas.toDataURL("image/png");
//       link.click();
//     });
//   };

//   // ------------------ مشاركة الكارت ------------------
//   const handleShare = () => {
//     if (!cardRef.current) return;
//     html2canvas(cardRef.current, { useCORS: true }).then((canvas) => {
//       canvas.toBlob((blob) => {
//         const file = new File([blob], "GraduateID.png", { type: "image/png" });

//         if (navigator.share) {
//           navigator.share({
//             title: t("digitalId_shareTitle"),
//             text: t("digitalId_shareText"),
//             files: [file],
//           }).catch((error) => console.log("Error sharing:", error));
//         } else {
//           alert(t("digitalId_noShareSupport"));
//         }
//       });
//     });
//   };

//   if (!user) return <p>{t("digitalId_loading")}</p>;

//   const fullName = user.fullName;

//   return (
//     <div>
//       <h1 className="uni-header">{t("digitalId_title")}</h1>
//       <h4 className="h4">{t("digitalId_subtitle")}</h4>

//       <div className="IdCardArea" ref={cardRef}>
//       <div className="card-header">
//   <img src={UniLogo} alt="University Logo" className="uni-logo" />
//   <span className="header-text">{t("digitalId_cardHeader")}</span>
// </div>


//         <div className="card-body">
//           <div className="cardcontent">
//             <p className="p">
//               <strong className="strong">{t("digitalId_fullName")}:</strong> {fullName} <br/>
//               <strong className="strong">{t("digitalId_faculty")}:</strong> {user.faculty} <br/>
//               <strong className="strong">{t("digitalId_graduationYear")}:</strong> {user.graduationYear} <br/>
//               <strong className="strong">{t("digitalId_graduateID")}:</strong> {user.digitalID} <br/>
//               <strong className="strong">{t("digitalId_nationalNumber")}:</strong> {user.nationalNumber}
//             </p>
//           </div>

//           <img 
//             className="profile-picc"
//             src={imgSrc} // استخدمنا الـ Base64 أو fallback
//             alt="Profile" 
//             crossOrigin="anonymous"
//           />
//         </div>
//       </div>

//       <div style={{ textAlign: "center", marginTop: "20px" }}>
//         <button className="button" onClick={handleDownload}>
//           {t("digitalId_downloadBtn")}
//         </button>
//         <button className="button" onClick={handleShare}>
//           {t("digitalId_shareBtn")}
//         </button>
//       </div>
//     </div>
//   );
// }

// export default DigitalID;

import './DigitalId.css';
import html2canvas from "html2canvas";
import { useRef, useState, useEffect } from "react";
import PROFILE from "./PROFILE.jpeg";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import UniLogo from '../../components/logo-white-deskt-min.png';

function DigitalID() {
  const { t } = useTranslation();
  const cardRef = useRef(null);
  const [user, setUser] = useState(null);
  const [profileImg, setProfileImg] = useState(PROFILE);
  const [qrImg, setQrImg] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token"); 
        const res = await API.get("/graduates/digital-id", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data.data;
        setUser(data);

        if (data.personalPicture) {
          loadImageAsDataURL(data.personalPicture).then(setProfileImg);
        }

        if (data.qr) setQrImg(data.qr);

      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, []);

  const loadImageAsDataURL = async (url) => {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Failed to load image, using default:", err);
      return PROFILE;
    }
  };

  const handleDownload = () => {
    if (!cardRef.current) return;
    html2canvas(cardRef.current, { useCORS: true }).then((canvas) => {
      const link = document.createElement("a");
      link.download = "GraduateID.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const handleShare = () => {
    if (!cardRef.current) return;
    html2canvas(cardRef.current, { useCORS: true }).then((canvas) => {
      canvas.toBlob((blob) => {
        const file = new File([blob], "GraduateID.png", { type: "image/png" });

        if (navigator.share) {
          navigator.share({
            title: t("digitalId_shareTitle"),
            text: t("digitalId_shareText"),
            files: [file],
          }).catch((error) => console.log("Error sharing:", error));
        } else {
          alert(t("digitalId_noShareSupport"));
        }
      });
    });
  };

  if (!user) return <p>{t("digitalId_loading")}</p>;

  return (
    <div>
      <h1 className="uni-header">{t("digitalId_title")}</h1>
      <h4 className="h4">{t("digitalId_subtitle")}</h4>

      <div className="IdCardArea" ref={cardRef}>
        <div className="card-header">
          <img src={UniLogo} alt="University Logo" className="uni-logo" />
          <span className="header-text">{t("digitalId_cardHeader")}</span>
        </div>

        <div className="card-body">
          <div className="cardcontent">
            <p className="p">
              <strong>{t("digitalId_fullName")}:</strong> {user.fullName} <br/>
              <strong>{t("digitalId_faculty")}:</strong> {user.faculty} <br/>
              <strong>{t("digitalId_graduationYear")}:</strong> {user.graduationYear} <br/>
              <strong>{t("digitalId_graduateID")}:</strong> {user.graduationId} <br/>
              <strong>{t("digitalId_nationalNumber")}:</strong> {user.nationalId}
            </p>
          </div>

          <div className="images-section">
            {/* <img 
              className="profile-picc"
              src={profileImg} 
              alt="Profile" 
              crossOrigin="anonymous"
            /> */}
            {qrImg && (
              <img 
                className="qr-picc"
                src={qrImg} 
                alt="QR Code" 
                crossOrigin="anonymous"
                onClick={() => window.open(`/helwan-alumni-portal/public-graduate/${user.graduationId}`, "_blank")}
  style={{ cursor: "pointer" }}
              />
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button className="button" onClick={handleDownload}>
          {t("digitalId_downloadBtn")}
        </button>
        <button className="button" onClick={handleShare}>
          {t("digitalId_shareBtn")}
        </button>
      </div>
    </div>
  );
}

export default DigitalID;
