import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LinkedInCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    // ابعتي الكود للسيرفر لتحصلي على JWT وبيانات المستخدم
    fetch(`http://localhost:5005/alumni-portal/auth/linkedin/callback?code=${code}&state=${state}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data.user));
          navigate("/helwan-alumni-portal/dashboard");
        }
      });
  }, []);

  return <p>Logging in with LinkedIn...</p>;
};

export default LinkedInCallback;
