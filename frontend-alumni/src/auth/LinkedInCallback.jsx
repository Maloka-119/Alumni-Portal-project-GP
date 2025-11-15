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
        const res = await API.post("/auth/linkedin/callback", { code, state });

        const { user, token } = res.data?.data || {};

        if (!user || !token) {
          throw new Error("Invalid response from server");
        }

        // خزّن الـ token والمستخدم
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);

        // تحويل المستخدم حسب النوع
        const type = user.userType?.toLowerCase();
        switch (type) {
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
            // لو النوع غير معروف، ارجعيه للصفحة الرئيسية بدل login
            navigate("/helwan-alumni-portal", { replace: true });
            break;
        }
      } catch (err) {
        console.error("Error during LinkedIn login:", err);
        alert("LinkedIn login failed. Please try again.");
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
