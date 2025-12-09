// import React, { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import API from "../../services/api";
// import { BookOpen, Book, X } from "lucide-react";
// import "./Services.css";

// const Services = () => {
//   const { t, i18n } = useTranslation();
//   const [services, setServices] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedService, setSelectedService] = useState(null);

//   useEffect(() => {
//     API.get("/university-services")
//       .then((res) => {
//         if (res.data.success) {
//           setServices(res.data.data);
//         }
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error(err);
//         setLoading(false);
//       });
//   }, []);

//   const getIcon = (pref) => {
//     switch (pref) {
//       case "e-library":
//         return <BookOpen size={40} />;
//       default:
//         return <Book size={40} />;
//     }
//   };

//   if (loading) return <p>{t("loading")}...</p>;

//   return (
//     <div className="services-page">
//       <h2 className="uni-header">
//         {i18n.language === "ar" ? "الخدمات الجامعية" : "University Services"}
//       </h2>

//       <div className="services-container">
//         {services.map((service) => (
//           <div
//             key={service.id}
//             className="service-card"
//             onClick={() => setSelectedService(service)}
//           >
//             {getIcon(service.pref)}
//             <h3>{service.title}</h3>
//           </div>
//         ))}
//       </div>

//       {selectedService && (
//   <div className="modal-overlay" onClick={() => setSelectedService(null)}>
//     <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//       <button className="modal-close" onClick={() => setSelectedService(null)}>
//         <X size={20} />
//       </button>
//       <h2 className="modal-title">{selectedService.title}</h2>

//       {Array.isArray(selectedService.details) ? (
//         <ol className="modal-steps">
//           {selectedService.details.map((step, index) => (
//             <li key={index}>{step}</li>
//           ))}
//         </ol>
//       ) : (
//         <p className="modal-details">{selectedService.details}</p>
//       )}
//     </div>
//   </div>
// )}

//     </div>
//   );
// };

// export default Services;

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import API from "../../services/api";
import { BookOpen, Book, X } from "lucide-react";
import "./Services.css";

const Services = () => {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    API.get("/university-services")
      .then((res) => {
        if (res.data.success) {
          setServices(res.data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getIcon = (pref) => {
    switch (pref) {
      case "e-library":
        return <BookOpen size={40} />;
      default:
        return <Book size={40} />;
    }
  };

  if (loading) return <p>{t("loading")}...</p>;

  return (
    <div className="services-page">
      <h2 className="uni-header">
        {i18n.language === "ar" ? "الخدمات الجامعية" : "University Services"}
      </h2>

      <div className="services-container">
        {services.map((service) => (
          <div className="service-card">
          <div className="service-card-content">
            {getIcon(service.pref)}
            <h3>{service.title}</h3>
          </div>
        
          <hr className="service-divider" />
          <button
            className="service-btn"
            onClick={() => setSelectedService(service)}
          >
            {i18n.language === "ar" ? "عرض التفاصيل" : "View Details"}
          </button>
        </div>
        
        ))}
      </div>

      {selectedService && (
        <div
          className="semodal-overlay"
          onClick={() => setSelectedService(null)}
        >
          <div className="semodal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="semodal-close"
              onClick={() => setSelectedService(null)}
            >
              <X size={20} />
            </button>
            <h2 className="semodal-title">{selectedService.title}</h2>

            {Array.isArray(selectedService.details) ? (
              <ol className="semodal-steps">
                {selectedService.details.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="semodal-details">{selectedService.details}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
