import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const LinkedInCallback = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const id = params.get("id");
    const email = params.get("email");
    const userType = params.get("userType");
    const firstName = params.get("firstName");
    const lastName = params.get("lastName");
    const error = params.get("error");

    console.log("LinkedIn callback params:", { token: !!token, id, email, userType, error });

    // Check for error first
    if (error) {
      console.error("LinkedIn callback error:", error);
      navigate("/helwan-alumni-portal/login?error=" + encodeURIComponent(error));
      return;
    }

    if (token && id) {
      // Store token and user data
      localStorage.setItem("token", token);
      const userData = {
        id: parseInt(id),
        email: email,
        userType: userType,
        "first-name": firstName,
        "last-name": lastName
      };
      localStorage.setItem("user", JSON.stringify(userData));
      
      if (setUser) {
        setUser(userData);
      }
      
      // Redirect to appropriate dashboard based on user type
      if (userType === "admin") {
        navigate("/helwan-alumni-portal/admin/dashboard");
      } else if (userType === "staff") {
        navigate("/helwan-alumni-portal/staff/dashboard");
      } else {
        navigate("/helwan-alumni-portal/graduate/dashboard");
      }
    } else {
      // No token and no error - something went wrong
      console.error("LinkedIn callback: No token or ID provided");
      navigate("/helwan-alumni-portal/login?error=" + encodeURIComponent("LinkedIn authentication failed. Please try again."));
    }
  }, [location, navigate, setUser]);

  return <p>Logging in with LinkedIn...</p>;
};

export default LinkedInCallback;
