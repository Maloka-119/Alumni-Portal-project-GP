// src/auth/LinkedInCallback.jsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

const LinkedInCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const code = query.get("code");
    const state = query.get("state");

    if (!code || !state) {
      console.error("Missing code or state from LinkedIn");
      alert("LinkedIn login failed: missing code or state.");
      navigate("/helwan-alumni-portal/login");
      return;
    }

    const handleLinkedInLogin = async () => {
      try {
        const res = await API.post("/auth/linkedin/callback", { code, state });
        const { user, token } = res.data.data;

        // حفظ التوكن والمستخدم في localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // توجيه حسب نوع المستخدم
        if (user.userType === "admin") {
          navigate("/helwan-alumni-portal/admin/dashboard", { replace: true });
        } else if (user.userType === "graduate") {
          navigate("/helwan-alumni-portal/graduate/dashboard", { replace: true });
        } else if (user.userType === "staff") {
          navigate("/helwan-alumni-portal/staff/dashboard", { replace: true });
        } else {
          navigate("/helwan-alumni-portal/login", { replace: true });
        }
      } catch (err) {
        console.error("Error during LinkedIn login:", err);
        alert("LinkedIn login failed. Please try again.");
        navigate("/helwan-alumni-portal/login");
      }
    };

    handleLinkedInLogin();
  }, [location, navigate]);

  return <div style={{ textAlign: "center", marginTop: "50px" }}>Logging in with LinkedIn...</div>;
};

export default LinkedInCallback;
