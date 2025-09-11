import './DigitalId.css';
import html2canvas from "html2canvas";
import { useRef, useState, useEffect } from "react";

function DigitalID({ userId }) {
  const cardRef = useRef(null);
  const [user, setUser] = useState(null);
  const API_URL = "http://localhost:5005/graduates"; // عدلي حسب الباك إند

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = () => {
    if (cardRef.current) {
      html2canvas(cardRef.current).then((canvas) => {
        const link = document.createElement("a");
        link.download = "GraduateID.png";
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

  const handleShare = () => {
    if (cardRef.current) {
      html2canvas(cardRef.current).then((canvas) => {
        canvas.toBlob((blob) => {
          const file = new File([blob], "GraduateID.png", { type: "image/png" });

          if (navigator.share) {
            navigator.share({
              title: "My Graduate ID",
              text: "Here is my Graduate ID",
              files: [file],
            })
            .then(() => console.log("Shared successfully!"))
            .catch((error) => console.log("Error sharing:", error));
          } else {
            alert("Sharing not supported on this browser.");
          }
        });
      });
    }
  };

  if (!user) return <p>Loading...</p>;

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div>
      <h1 className="h1">Digital ID</h1>
      <h4 className="h4">
        Your Graduate ID is ready! Use it to verify your graduation and access alumni services
      </h4>

      <div className="IdCardArea" ref={cardRef}>
        <div className="card-header">
          <p>Graduate ID</p>
        </div>

        <div className="card-body">
          <div className="cardcontent">
            <p className="p">
              <strong className="strong">Full Name:</strong> {fullName} <br/>
              <strong className="strong">Faculty:</strong> {user.faculty} <br/>
              <strong className="strong">Program:</strong> {user.program} <br/>
              <strong className="strong">Graduation Year:</strong> {user.graduationYear} <br/>
              <strong className="strong">Graduate ID:</strong> {user.graduateID} <br/>
              <strong className="strong">National Number:</strong> {user.nationalNumber}
            </p>
          </div>

          <img 
            className="profile-picc"
            src={user.profilePicture}
            alt="Profile" 
          />
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button className="button" onClick={handleDownload}>Download Digital ID</button>
        <button className="button" onClick={handleShare}>Share Digital ID</button>
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
