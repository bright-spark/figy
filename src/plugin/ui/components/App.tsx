import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import { Notification } from './Notification';
import styles from '../styles/App.module.css';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'info' | 'success' | 'error';
  } | null>(null);

  const handleImageUpload = useCallback(async (imageData: string) => {
    try {
      setIsLoading(true);
      parent.postMessage(
        {
          pluginMessage: {
            type: 'analyze-image',
            payload: { imageData },
          },
        },
        '*'
      );
    } catch (error) {
      setNotification({
        message: 'Failed to process image',
        type: 'error',
      });
      setIsLoading(false);
    }
  }, []);

  // Handle messages from the plugin
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data.pluginMessage) return;

      const { type, payload } = event.data.pluginMessage;

      switch (type) {
        case 'notify':
          setNotification({
            message: payload.message,
            type: payload.type,
          });
          setIsLoading(false);
          break;

        case 'error':
          setNotification({
            message: payload.message || 'An unexpected error occurred',
            type: 'error',
          });
          setIsLoading(false);
          break;

        case 'ready':
          // Plugin is ready, stop loading
          setIsLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Signal that UI is ready
    parent.postMessage({ pluginMessage: { type: 'ui-ready' } }, '*');

    // Initial loading timeout
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      setNotification({
        message: 'Plugin initialization timed out',
        type: 'error',
      });
    }, 10000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(loadingTimeout);
    };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading AI UI Converter...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <h1 className={styles.title}>AI UI Converter</h1>
      <ImageUploader onUpload={handleImageUpload} />
    </div>
  );
};
