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
      <h1 className="h1">{t("digitalId_title")}</h1>
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
// // import Footer from './Footer';
// import html2canvas from "html2canvas";
// import { useRef, useState } from "react";


// function DigitalID() {
//   const cardRef = useRef(null);

//   // بيانات الخريج
//   const [user] = useState({
//     firstName: "Omar",
//     lastName: "Emad Sayed",
//     faculty: "Computer Science",
//     program: "Software Engineering",
//     graduationYear: "2024/2025",
//     graduateID: "20225253",
//     nationalNumber: "3059697970088",
//     profilePicture: "/OIP.webp",
  
//   });

//   // دمج الاسم الأول مع الأخير
//   const fullName = `${user.firstName} ${user.lastName}`;

//   // تحميل الـ ID كصورة
//   const handleDownload = () => {
//     if (cardRef.current) {
//       html2canvas(cardRef.current).then((canvas) => {
//         const link = document.createElement("a");
//         link.download = "GraduateID.png";
//         link.href = canvas.toDataURL();
//         link.click();
//       });
//     }
//   };

//   // مشاركة الـ ID كصورة
//   const handleShare = () => {
//     if (cardRef.current) {
//       html2canvas(cardRef.current).then((canvas) => {
//         canvas.toBlob((blob) => {
//           const file = new File([blob], "GraduateID.png", { type: "image/png" });

//           if (navigator.share) {
//             navigator.share({
//               title: "My Graduate ID",
//               text: "Here is my Graduate ID",
//               files: [file],
//             })
//             .then(() => console.log("Shared successfully!"))
//             .catch((error) => console.log("Error sharing:", error));
//           } else {
//             alert("Sharing not supported on this browser.");
//           }
//         });
//       });
//     }
//   };

//   return (
//     <div 
      
//     >
//       <h1 className="h1">Digital ID</h1>
//       <h4 className="h4">
//         Your Graduate ID is ready! Use it to verify your graduation and access alumni services
//       </h4>

//       {/* بطاقة الخريج */}
//       <div className="IdCardArea" ref={cardRef}>
//         {/* Blue top bar مع لوجو */}
//         <div className="card-header">
//           {/*<img src="/logo.jpg"  className="logo" />  */}
//          <p > Graduate ID</p>
//         </div>

//         {/* Card content */}
//         <div className="card-body">
//           <div className="cardcontent">
//             <p className="p">
//               <strong className="strong">Full Name:</strong> {fullName} <br/>
//               <strong className="strong">Faculty:</strong> {user.faculty} <br/>
//               <strong className="strong">Program:</strong> {user.program} <br/>
//               <strong className="strong">Graduation Year:</strong> {user.graduationYear} <br/>
//               <strong className="strong">Graduate ID:</strong> {user.graduateID} <br/>
//               <strong className="strong">National Number:</strong> {user.nationalNumber}
//             </p>
//           </div>

//           {/* الصورة على اليمين */}
//           <img 
//             className="profile-picc"
//             src={user.profilePicture} 
//             alt="Profile" 
//           />
//         </div>


//       </div>

//       {/* الأزرار */}
//       <div style={{ textAlign: "center", marginTop: "20px" }}>
//         <button className="button" onClick={handleDownload}>Download Digital ID</button>
//         <button className="button" onClick={handleShare}>Share Digital ID</button>
//       </div>

//       {/* <Footer/> */}
//     </div>
//   );
// }

// export default DigitalID;
