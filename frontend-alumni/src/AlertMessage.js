import './Alert.css';
import { useEffect, useState } from 'react';

function AlertMessage({ type, message, duration = 3000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return <div className={`alert ${type}`}>{message}</div>;
}

export default AlertMessage;
