import React, { useEffect } from 'react';
import styles from '../styles/Notification.module.css';

interface Props {
  message: string;
  type: 'info' | 'success' | 'error';
  onClose: () => void;
  autoHideDuration?: number;
}

export const Notification: React.FC<Props> = ({
  message,
  type,
  onClose,
  autoHideDuration = 5000,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, autoHideDuration);
    return () => clearTimeout(timer);
  }, [autoHideDuration, onClose]);

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeButton} onClick={onClose}>
        ✕
      </button>
    </div>
  );
};
