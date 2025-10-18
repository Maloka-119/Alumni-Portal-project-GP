import React, { useEffect } from "react";
import '../app.css';

function Alert({ type = "success", message, onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`my-alert ${type}`}>
      {message}
    </div>
  );
}

export default Alert;
