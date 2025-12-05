import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import Swal from "sweetalert2";

const CompleteRegistration = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const email = params.get("email");
  const token = params.get("token");
  const userType = params.get("userType");

  const [nationalId, setNationalId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        email,
        "national-id": nationalId,
        "phone-number": phoneNumber,
      };

      const res = await API.post("/auth/register/google-complete", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 200 || res.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Registration Complete",
          timer: 2000,
          showConfirmButton: false,
        });

        // بعد إكمال البيانات، توجيه المستخدم للـ login
        navigate("/helwan-alumni-portal/login", { replace: true });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || err.message,
      });
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "400px",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "10px",
        }}
      >
        <h2>Complete Registration</h2>
        <div className="form-group">
          <label>National ID</label>
          <input
            type="text"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
        <button type="submit" style={{ marginTop: "10px" }}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default CompleteRegistration;