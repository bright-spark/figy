import React, { useCallback, useState } from 'react';
import styles from '../styles/ImageUploader.module.css';

interface Props {
  onUpload: (imageData: string) => void;
}

export const ImageUploader: React.FC<Props> = ({ onUpload }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImage = useCallback(
    (file: File) => {
      if (file && file.type.startsWith('image/')) {
        // Create preview URL
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Read file for upload
        const reader = new FileReader();
        reader.onload = () => {
          onUpload(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const file = event.dataTransfer.files[0];
      if (file) {
        handleImage(file);
      }
    },
    [handleImage]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleImage(file);
      }
    },
    [handleImage]
  );

  // Cleanup preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropzone} ${previewUrl ? styles.hasPreview : ''}`}
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
        {!previewUrl ? (
          <>
            <label htmlFor="file-upload" className={styles.uploadButton}>
              Choose Image
            </label>
            <p className={styles.dragText}>or drag and drop an image here</p>
          </>
        ) : (
          <div className={styles.previewContainer}>
            <img src={previewUrl} alt="Preview" className={styles.preview} />
            <button
              className={styles.removeButton}
              onClick={() => {
                setPreviewUrl(null);
                const input = document.getElementById('file-upload') as HTMLInputElement;
                if (input) {
                  input.value = '';
                }
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
