import React, { useState } from "react";
import Swal from "sweetalert2";

const GoogleNationalIdModal = ({ isOpen, onClose, onProceed }) => {
  const [nationalId, setNationalId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nationalId || nationalId.length !== 14) {
      Swal.fire({
        icon: "warning",
        title: "Invalid National ID",
        text: "National ID must be exactly 14 digits",
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    setLoading(true);
    try {
      await onProceed({ nationalId });
      onClose();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="national-id-modal">
        <div className="modal-header">
          <h3>Complete Google Registration</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="modal-description">
              To complete your registration with Google, please enter your 14-digit Egyptian National ID.
              This will help us verify your identity with the university database.
            </p>
            
            <div className="form-group">
              <label htmlFor="nationalId" className="form-label">
                National ID (14 digits)
              </label>
              <input
                type="text"
                id="nationalId"
                className="form-input"
                placeholder="Enter your 14-digit national ID"
                value={nationalId}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 14) setNationalId(value);
                }}
                maxLength={14}
                required
                autoFocus
              />
              <small className="input-hint">
                Example: 30101010101010
              </small>
            </div>
            
            <div className="security-notice">
              <p>🔒 Your data is securely encrypted and will be verified with:</p>
              <ul>
                <li>Staff database for faculty members</li>
                <li>Graduate database for alumni</li>
              </ul>
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || nationalId.length !== 14}
            >
              {loading ? "Processing..." : "Continue with Google"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// CSS Styles
const modalStyles = `
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.national-id-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease-out;
  overflow: hidden;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #4285F4, #34A853);
  color: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: white;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 20px;
}

.modal-description {
  color: #555;
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #4285F4;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.input-hint {
  display: block;
  margin-top: 5px;
  color: #777;
  font-size: 0.85rem;
}

.security-notice {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  border-left: 4px solid #4285F4;
}

.security-notice p {
  margin: 0 0 10px 0;
  color: #333;
  font-weight: 500;
}

.security-notice ul {
  margin: 0;
  padding-left: 20px;
  color: #555;
}

.security-notice li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  font-size: 0.95rem;
}

.btn-primary {
  background: linear-gradient(135deg, #4285F4, #34A853);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);

export default GoogleNationalIdModal;