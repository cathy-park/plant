"use client";

import React, { useRef } from 'react';
import styles from '../styles/Camera.module.css';
import { Camera, Image as ImageIcon, Leaf, FlaskConical } from 'lucide-react';

interface CameraCaptureProps {
  onImageCapture: (file: File) => void;
  onMockTest?: () => void;
}

export default function CameraCapture({ onImageCapture, onMockTest }: CameraCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => cameraInputRef.current?.click();
  const handleAlbumClick = () => albumInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageCapture(file);
    }
  };

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <h1 className={styles.title}>Plant Lens</h1>
      <p className={styles.subtitle}>렌즈에 식물을 담아보세요</p>

      <div className={styles.viewfinder} onClick={handleCameraClick}>
        <div className={styles.icon}>
          <Leaf size={48} color="var(--color-primary)" />
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button className={styles.uploadButton} onClick={handleCameraClick}>
          <Camera size={20} style={{ marginRight: '8px' }} />
          식물 촬영하기
        </button>
        <button className={styles.outlineButton} onClick={handleAlbumClick}>
          <ImageIcon size={20} style={{ marginRight: '8px' }} />
          앨범에서 가져오기
        </button>
      </div>

      {onMockTest && (
        <button 
          className={styles.textLink} 
          onClick={onMockTest}
        >
          결과 페이지 샘플 보기
        </button>
      )}

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        className={styles.hiddenInput}
        onChange={handleFileChange}
      />
      
      <input
        type="file"
        accept="image/*"
        ref={albumInputRef}
        className={styles.hiddenInput}
        onChange={handleFileChange}
      />

      <div className={styles.instructions}>
        <p>선명하게 초점을 맞춰주세요.</p>
        <p>나무나 큰 식물은 잎사귀가 잘 보이게 가까이서 찍어주시면 더 정확해요!</p>
      </div>
    </div>
  );
}
