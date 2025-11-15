import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

const LinkedInCallback = ({ setUser }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const code = query.get("code");
    const state = query.get("state");

    if (!code || !state) {
      alert("LinkedIn login failed: missing code or state.");
      navigate("/helwan-alumni-portal", { replace: true });
      return;
    }

    const loginWithLinkedIn = async () => {
      try {
        // ✅ استخدم GET بدلاً من POST مع query parameters
        const res = await API.get("/auth/linkedin/callback", {
          params: { code, state },
          withCredentials: true, // مهم للـ session cookies
        });

        // ✅ تحقق من structure الرد
        if (res.data?.status !== 'success') {
          throw new Error(res.data?.message || 'Authentication failed');
        }

        const { user, token } = res.data?.data || {};

        if (!user || !token) {
          console.error('Response data:', res.data);
          throw new Error("Invalid response from server - missing user or token");
        }

        // ✅ استخدم 'user-type' بدلاً من userType
        const userType = user['user-type'] || user.userType; // دعم كلا الشكلين
        
        // خزّن الـ token والمستخدم
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify({
          id: user.id,
          email: user.email,
          userType: userType, // احفظه كـ userType للفرونت
          firstName: user['first-name'],
          lastName: user['last-name'],
        }));
        setUser({
          id: user.id,
          email: user.email,
          userType: userType,
        });

        // تحويل المستخدم حسب النوع
        switch (userType?.toLowerCase()) {
          case "admin":
            navigate("/helwan-alumni-portal/admin/dashboard", { replace: true });
            break;
          case "graduate":
            navigate("/helwan-alumni-portal/graduate/dashboard", { replace: true });
            break;
          case "staff":
            navigate("/helwan-alumni-portal/staff/dashboard", { replace: true });
            break;
          default:
            console.warn("Unknown user type:", userType);
            navigate("/helwan-alumni-portal", { replace: true });
            break;
        }
      } catch (err) {
        console.error("Error during LinkedIn login:", err);
        console.error("Error response:", err.response?.data);
        alert(err.response?.data?.message || err.message || "LinkedIn login failed. Please try again.");
        navigate("/helwan-alumni-portal", { replace: true });
      }
    };

    loginWithLinkedIn();
  }, [location, navigate, setUser]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      Logging in with LinkedIn...
    </div>
  );
};

export default LinkedInCallback;
