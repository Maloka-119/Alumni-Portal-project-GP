
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const GoogleLoginButton = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleLogin = () => {
    window.open("http://localhost:5005/alumni-portal/auth/google", "_self");
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const id = params.get("id");
    const email = params.get("email");
    const userType = params.get("userType");
    let nationalId = params.get("nationalId");

    // تحويل "null" string لـ null
    if (nationalId === "null") nationalId = null;

    if (token && id && email && userType) {
      if (!nationalId) {
        // المستخدم يحتاج لإكمال البيانات أولًا
        navigate(
          `/helwan-alumni-portal/complete-registration?email=${email}&token=${token}&userType=${userType}`,
          { replace: true }
        );
      } else {
        // تخزين البيانات في localStorage بعد التأكد إن الرقم القومي موجود
        const user = { id, email, userType, nationalId };
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        if (setUser) setUser(user);

        // توجيه المستخدم للداشبورد المناسب
        if (userType === "admin") {
          navigate("/helwan-alumni-portal/admin/dashboard", { replace: true });
        } else if (userType === "graduate") {
          navigate("/helwan-alumni-portal/graduate/dashboard", { replace: true });
        } else if (userType === "staff") {
          navigate("/helwan-alumni-portal/staff/dashboard", { replace: true });
        }
      }
    }
  }, [location.search, navigate, setUser]);

  return (
    <button
      onClick={handleGoogleLogin}
      style={{
        padding: "10px 20px",
        backgroundColor: "#4285F4",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        marginTop: "10px",
      }}
    >
      Sign in with Google
    </button>
  );
};

export default GoogleLoginButton;