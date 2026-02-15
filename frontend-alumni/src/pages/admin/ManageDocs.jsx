import React, { useState, useEffect } from "react";
import { Eye, CheckCircle, XCircle, FileText, Loader, AlertCircle } from "lucide-react";
import API from "../../services/api";
import "./ManageDocs.css";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { getPermission } from "../../components/usePermission";

function ManageDocs({ currentUser }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  // جلب الصلاحية - طالما أن docPerm ليس null فالمستخدم مسموح له بالدخول
  const docPerm = getPermission("Document Requests management", currentUser);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get("/documents/requests");
      const rawData = res.data?.data || [];
      
      const normalizedData = rawData.map(req => {
        let finalAttachments = [];
        try {
          if (req.attachments) {
            if (Array.isArray(req.attachments)) {
              finalAttachments = req.attachments;
            } else if (typeof req.attachments === 'string') {
              let parsed = JSON.parse(req.attachments);
              if (typeof parsed === 'string') parsed = JSON.parse(parsed);
              finalAttachments = Array.isArray(parsed) ? parsed : [];
            }
          }
        } catch (e) {
          finalAttachments = []; 
        }
        return { ...req, attachments: finalAttachments, id: req.document_request_id };
      });

      setRequests(normalizedData);
    } catch (err) {
      console.error("Error loading requests:", err);
      // اختياري: يمكنك إضافة تنبيه هنا لإخبار المستخدم بوجود خطأ في السيرفر
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!docPerm?.canEdit) {
      Swal.fire({ icon: "error", title: t("warning"), text: t("noPermission") });
      return;
    }

    const result = await Swal.fire({
      title: t("confirmAction"),
      text: `${t("changeStatusTo")} ${t(newStatus)}?`,
      icon: "warning",
      input: "textarea",
      inputPlaceholder: t("addNotes"),
      showCancelButton: true,
      confirmButtonColor: newStatus === "approved" ? "#10b981" : "#ef4444",
      confirmButtonText: t("yes"),
      cancelButtonText: t("cancel")
    });

    if (result.isConfirmed) {
      try {
        await API.put(`/documents/requests/${id}/status`, {
          status: newStatus,
          notes: result.value || ""
        });
        Swal.fire({ icon: "success", title: t("updated"), text: t("successMsg") });
        fetchRequests();
      } catch (err) {
        Swal.fire({ icon: "error", title: t("error"), text: t("updateFailed") });
      }
    }
  };

  const handleViewDetails = (req) => {
    Swal.fire({
      title: `<span class="adm-swal-title">${t("requestDetails")}</span>`,
      html: `
        <div class="adm-swal-container" style="direction: ${i18n.language === 'ar' ? 'rtl' : 'ltr'};">
          <div class="adm-swal-row">
            <span class="label">${t("reqNo")}</span>
            <span class="value">#${req.request_number}</span>
          </div>
          <div class="adm-swal-row">
            <span class="label">${t("graduateName")}</span>
            <span class="value">${req.graduate_name}</span>
          </div>
          <div class="adm-swal-row">
            <span class="label">${t("nationalId")}</span>
            <span class="value" style="word-break: break-all; max-width: 200px; text-align: end;">
                ${req.national_id || '---'}
            </span>
          </div>
          <div class="adm-swal-notes">
            <span class="label" style="display: block; margin-bottom: 8px; font-weight: 700;">${t("gradNotes")}</span>
            <p class="notes-text">${req.notes || t("noNotes")}</p>
          </div>
          <div class="adm-swal-footer" style="margin-top: 20px;">
            <span class="adm-status-pill status-${req.status}">${t(req.status)}</span>
          </div>
        </div>
      `,
      showCloseButton: true,      
      showConfirmButton: false,    
      customClass: {
        popup: 'adm-swal-popup-custom',
      }
    });
};

  return (
    <div className="adm-docs-container">
      <header className="adm-docs-header">
        <h1 className="adm-docs-title">{t("graduateRequests")}</h1>
        <p className="adm-docs-subtitle">{t("manageAndReviewDocs")}</p>
      </header>

      {loading ? (
        <div className="adm-loading-wrapper">
          <div className="adm-loader-spinner"></div>
          <p>{t("loading")}</p>
        </div>
      ) : requests.length > 0 ? (
        <div className="adm-table-responsive-wrapper">
          <table className="adm-main-table">
            <thead>
              <tr>
                <th>{t("reqNo")}</th>
                <th>{t("graduateName")}</th>
                <th>{t("documentType")}</th>
                <th>{t("status")}</th>
                <th>{t("attachments")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td data-label={t("reqNo")} className="adm-req-num">#{req.request_number}</td>
                  <td data-label={t("graduateName")} className="adm-grad-name">{req.graduate_name}</td>
                  <td data-label={t("documentType")}>
                    {i18n.language === "ar" ? req.document_name_ar : req.document_name_en}
                  </td>
                  <td data-label={t("status")}>
                    <span className={`adm-status-pill status-${req.status}`}>
                      {t(req.status)}
                    </span>
                  </td>
                  <td data-label={t("attachments")}>
                    <div className="adm-files-stack">
                      {req.attachments.length > 0 ? (
                        req.attachments.map((file, idx) => (
                          <a 
                            key={idx} 
                            href={`${API.defaults.baseURL.replace('/api', '')}${file.url}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="adm-file-link"
                          >
                            <FileText size={14} /> {t("view")}
                          </a>
                        ))
                      ) : (
                        <span className="adm-no-files">---</span>
                      )}
                    </div>
                  </td>
                  <td data-label={t("actions")}>
                    <div className="adm-action-btns">
                      {/* زر المعاينة متاح دائماً لمن يملك صلاحية View */}
                      <button className="adm-btn-view" title={t("view")} onClick={() => handleViewDetails(req)}>
                        <Eye size={18} />
                      </button>

                      {/* أزرار القبول والرفض تظهر فقط لمن يملك canEdit */}
                      {docPerm?.canEdit && req.status === "under_review" && (
                        <>
                          <button className="adm-btn-approve" title={t("approve")} onClick={() => handleUpdateStatus(req.id, "approved")}>
                            <CheckCircle size={18} />
                          </button>
                          <button className="adm-btn-reject" title={t("reject")} onClick={() => handleUpdateStatus(req.id, "rejected")}>
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="adm-no-data-simple">
          <p>{t("noRequestsFound")}</p>
        </div>
      )}
    </div>
  );
}

export default ManageDocs;