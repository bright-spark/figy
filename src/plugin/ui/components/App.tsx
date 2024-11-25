import React, { useState, useCallback } from 'react';
import { ImageUploader } from './ImageUploader';
import { Notification } from './Notification';
import styles from '../styles/App.module.css';

export const App: React.FC = () => {
  const [notification, setNotification] = useState<{
    message: string;
    type: 'info' | 'success' | 'error';
  } | null>(null);

  const handleImageUpload = useCallback(async (imageData: string) => {
    try {
      parent.postMessage(
        {
          pluginMessage: {
            type: 'analyze-image',
            payload: { imageData }
          }
        },
        '*'
      );
    } catch (error) {
      setNotification({
        message: 'Failed to process image',
        type: 'error'
      });
    }
  }, []);

  // Handle messages from the plugin
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data.pluginMessage;
      
      switch (type) {
        case 'notify':
          setNotification({
            message: payload.message,
            type: payload.type
          });
          break;
          
        case 'error':
          setNotification({
            message: payload.message,
            type: 'error'
          });
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>AI UI Converter</h1>
      <ImageUploader onUpload={handleImageUpload} />
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};
