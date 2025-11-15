import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import Loading from '../components/Loading';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

const LinkedInCallback = ({ setUser }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        console.error('No authorization code received');
        Swal.fire({
          icon: 'error',
          title: t('authenticationFailed') || 'Authentication Failed',
          text: 'No authorization code received from LinkedIn',
        });
        navigate('/helwan-alumni-portal/login');
        return;
      }

      try {
        // Call backend callback endpoint with credentials to maintain session
        const response = await API.get('/auth/linkedin/callback', {
          params: { code, state },
          withCredentials: true, // Important for session cookies
        });

        if (response.data.status === 'success') {
          const userData = response.data.data.user;
          const token = response.data.data.token;

          // Format user object to match the expected structure
          const user = {
            id: userData.id,
            email: userData.email,
            userType: userData['user-type'],
            firstName: userData['first-name'],
            lastName: userData['last-name'],
            profilePictureUrl: userData.profile_picture_url,
          };

          // Save user and token
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('token', token);
          
          setUser(user);

          Swal.fire({
            icon: 'success',
            title: t('loginSuccess') || 'Login Successful',
            showConfirmButton: false,
            timer: 1500,
          });

          // Redirect based on user type
          const userType = userData['user-type'];
          if (userType === 'admin') {
            navigate('/helwan-alumni-portal/admin/dashboard', { replace: true });
          } else if (userType === 'staff') {
            navigate('/helwan-alumni-portal/staff/dashboard', { replace: true });
          } else {
            navigate('/helwan-alumni-portal/graduate/dashboard', { replace: true });
          }
        } else {
          throw new Error(response.data.message || 'Authentication failed');
        }
      } catch (error) {
        console.error('LinkedIn callback error:', error);
        Swal.fire({
          icon: 'error',
          title: t('authenticationFailed') || 'Authentication Failed',
          text: error.response?.data?.message || error.message || 'Failed to authenticate with LinkedIn',
        });
        navigate('/helwan-alumni-portal/login', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser, t]);

  return <Loading message="Processing LinkedIn authentication..." />;
};

export default LinkedInCallback;

