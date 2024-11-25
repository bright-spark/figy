import React, { useCallback } from 'react';
import styles from '../styles/ImageUploader.module.css';

interface Props {
  onUpload: (imageData: string) => void;
}

export const ImageUploader: React.FC<Props> = ({ onUpload }) => {
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const file = event.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          onUpload(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onUpload]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          onUpload(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onUpload]
  );

  return (
    <div
      className={styles.dropzone}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className={styles.fileInput}
        id="file-upload"
      />
      <label htmlFor="file-upload" className={styles.uploadButton}>
        Choose Image
      </label>
      <p className={styles.dragText}>or drag and drop an image here</p>
    </div>
  );
};
