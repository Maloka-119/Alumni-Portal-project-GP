import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../../services/api';
import './MyRequests.css';

const MyRequests = () => {
  const { t, i18n } = useTranslation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await API.get('/documents/requests/my-requests');
        console.log('📊 Requests Data:', response.data.data);
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

  const getStatusClass = (status) => {
    const statusMap = {
      'pending': 'status-pending',
      'completed': 'status-completed',
      'in progress': 'status-progress',
      'under review': 'status-review',
      'Pending': 'status-pending',
      'Completed': 'status-completed',
      'In Progress': 'status-progress',
      'under_review': 'status-review'
    };
    return statusMap[status] || '';
  };

  const statusTranslationMap = {
    'pending': 'statusPending',
    'completed': 'statusCompleted',
    'in progress': 'statusInProgress',
    'under review': 'statusUnderReview',
    'Pending': 'statusPending',
    'Completed': 'statusCompleted',
    'In Progress': 'statusInProgress',
    'Under Review': 'statusUnderReview'
  };

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
      <div>
        <h1 className="uni-header">{t('myRequestsTitle')}</h1>
        <p className="subtitle">{t('myRequestsSubtitle')}</p>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <h2>{t('noRequestsFound')}</h2>
          <p>{t('noRequestsDescription')}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>{t('requestNumber')}</th>
                {/* <th>{t('requestType')}</th> */}
                <th>{t('createdAt')}</th>
                <th>{t('requestStatus')}</th>
                <th>{t('expectedCompletion')}</th>
                
                <th>{t('documentNameAr')}</th> 
              </tr>
            </thead>

            <tbody>
              {requests.map((req) => (
                <tr key={req.document_request_id}>
                  <td className="request-number">{req.request_number}</td>
                  {/* <td>{req['request-type']}</td> */}
                  <td>
  {req['created-at'] 
    ? new Date(req['created-at']).toLocaleDateString(
        i18n.language === 'ar' ? 'ar-EG-u-nu-arab' : 'en-GB',
        { year: 'numeric', month: 'numeric', day: 'numeric' }
      ) 
    : '---'}
</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(req.status)}`}>
                      {t(statusTranslationMap[req.status] || req.status)}
                    </span>
                  </td>
                  <td>
  {req.expected_completion_date 
    ? new Date(req.expected_completion_date).toLocaleDateString(
        i18n.language === 'ar' ? 'ar-EG-u-nu-arab' : 'en-GB', 
        { year: 'numeric', month: 'numeric', day: 'numeric' }
      ) 
    : '---'}
</td>

                  <td className={i18n.language === 'ar' ? 'arabic-text' : ''}>
                    {i18n.language === 'ar' ? req.document_name_ar : req.document_name_en}
                  </td>
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