import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../../services/api';
import './MyRequests.css';

const MyRequests = () => {
  const { t, i18n } = useTranslation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //  تغيير الاتجاه حسب اللغة
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  //  جلب الطلبات
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await API.get('/documents/requests/my-requests');
        setRequests(response.data.data || []);
      } catch (err) {
        console.error('❌ Error:', err);
        setError(err.response?.data?.message || t('errorsGeneral'));
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [t]);

  //  Status styles
  const getStatusClass = (status) => {
    const statusMap = {
      'Completed': 'status-completed',
      'In Progress': 'status-progress',
      'Pending': 'status-pending',
      'Under Review': 'status-review'
    };
    return statusMap[status] || '';
  };

  //  Status translation keys
  const statusTranslationMap = {
    'Completed': 'statusCompleted',
    'In Progress': 'statusInProgress',
    'Pending': 'statusPending',
    'Under Review': 'statusUnderReview'
  };

  //  Loading UI
  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('loadingRequests')}</p>
        </div>
      </div>
    );
  }

  //  Error UI
  if (error) {
    return (
      <div className="container">
        <p className="error-text">
          {t('errorLabel')}: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      {/*  Header */}
      <div>
        <h1 className="uni-header">{t('myRequestsTitle')}</h1>
        <p className="subtitle">{t('myRequestsSubtitle')}</p>
      </div>

      {requests.length === 0 ? (
        //  Empty State
        <div className="empty-state">
          <h2>{t('noRequestsFound')}</h2>
          <p>{t('noRequestsDescription')}</p>
        </div>
      ) : (
        //  Table
        <div className="table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>{t('requestNumber')}</th>
                <th>{t('requestType')}</th>
                <th>{t('requestStatus')}</th>
                <th>{t('expectedCompletion')}</th>
                <th>{t('createdAt')}</th>
                <th>{t('documentNameAr')}</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((req) => (
                <tr key={req.document_request_id}>
                  <td className="request-number">{req.request_number}</td>
                  <td>{req['request-type']}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusClass(req.status)}`}
                    >
                      {t(statusTranslationMap[req.status] || req.status)}
                    </span>
                  </td>
                  <td>
                    {new Date(req.expected_completion_date).toLocaleDateString()}
                  </td>
                  <td>
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="arabic-text">{req.document_name_ar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyRequests;

