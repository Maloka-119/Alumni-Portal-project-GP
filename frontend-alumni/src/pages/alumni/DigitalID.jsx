import './DigitalId.css';
import html2canvas from "html2canvas";
import { useRef, useState, useEffect } from "react";
import PROFILE from "./PROFILE.jpeg";
import { useTranslation } from "react-i18next";
import API from "../../services/api";

function DigitalID() {
  const { t } = useTranslation();
  const cardRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token"); 
        const res = await API.get("/graduates/digital-id", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // setUser(res.data);
        setUser(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  const handleDownload = () => {
    if (!cardRef.current) return;
    html2canvas(cardRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = "GraduateID.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const handleShare = () => {
    if (!cardRef.current) return;
    html2canvas(cardRef.current).then((canvas) => {
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

  const fullName = user.fullName;


  return (
    <div>
      <h1 className="uni-header">{t("digitalId_title")}</h1>
      <h4 className="h4">{t("digitalId_subtitle")}</h4>

      <div className="IdCardArea" ref={cardRef}>
        <div className="card-header">
          <p>{t("digitalId_cardHeader")}</p>
        </div>

        <div className="card-body">
          <div className="cardcontent">
            <p className="p">
              <strong className="strong">{t("digitalId_fullName")}:</strong> {fullName} <br/>
              <strong className="strong">{t("digitalId_faculty")}:</strong> {user.faculty} <br/>
              {/* <strong className="strong">{t("digitalId_program")}:</strong> {user.program} <br/> */}
              <strong className="strong">{t("digitalId_graduationYear")}:</strong> {user.graduationYear} <br/>
              <strong className="strong">{t("digitalId_graduateID")}:</strong> {user.digitalID} <br/>
              <strong className="strong">{t("digitalId_nationalNumber")}:</strong> {user.nationalNumber}
            </p>
          </div>

          <img 
            className="profile-picc"
            src={user.personalPicture || PROFILE}
            alt="Profile" 
          />
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




// import './DigitalId.css';
// import html2canvas from "html2canvas";
// import { useRef, useState, useEffect } from "react";
// import PROFILE from "./PROFILE.jpeg";
// import { useTranslation } from "react-i18next";
// import API from "../../services/api";

// function DigitalID() {
//   const { t } = useTranslation();
//   const cardRef = useRef(null);
//   const [user, setUser] = useState(null);
//   const [profileSrc, setProfileSrc] = useState(PROFILE);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const token = localStorage.getItem("token"); 
//         const res = await API.get("/graduates/digital-id", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const userData = res.data.data;
//         setUser(userData);

//         if (userData.personalPicture) {
//           // تحويل الصورة إلى base64
//           fetch(userData.personalPicture)
//             .then(res => res.blob())
//             .then(blob => {
//               const reader = new FileReader();
//               reader.onload = () => setProfileSrc(reader.result);
//               reader.readAsDataURL(blob);
//             })
//             .catch(() => setProfileSrc(PROFILE));
//         }
//       } catch (err) {
//         console.error(err);
//       }
//     };
//     fetchUser();
//   }, []);

//   const handleDownload = () => {
//     if (!cardRef.current) return;
//     html2canvas(cardRef.current).then((canvas) => {
//       const link = document.createElement("a");
//       link.download = "GraduateID.png";
//       link.href = canvas.toDataURL("image/png");
//       link.click();
//     });
//   };

//   const handleShare = () => {
//     if (!cardRef.current) return;
//     html2canvas(cardRef.current).then((canvas) => {
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
//       <h1 className="h1">{t("digitalId_title")}</h1>
//       <h4 className="h4">{t("digitalId_subtitle")}</h4>

//       <div className="IdCardArea" ref={cardRef}>
//         <div className="card-header">
//           <p>{t("digitalId_cardHeader")}</p>
//         </div>

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
//             src={profileSrc}
//             alt="Profile" 
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
