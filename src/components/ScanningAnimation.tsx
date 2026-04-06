"use client";

import React from 'react';
import styles from '../styles/Scanning.module.css';

interface ScanningAnimationProps {
  imagePreview: string;
}

export default function ScanningAnimation({ imagePreview }: ScanningAnimationProps) {
  return (
    <div className={`${styles.overlay} animate-fade-in`}>
      <div className={styles.imageContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagePreview} alt="Scanning target" className={styles.previewImage} />
        <div className={styles.scannerLine}></div>
      </div>
      
      <div className={styles.textContainer}>
        <h2 className={styles.analyzingText}>AI가 식물의 숨결을 읽어오는 중입니다...</h2>
        <p className={styles.subText}>새로운 식물이라면 렌즈 백과사전이 스스로 학습합니다!</p>
      </div>
    </div>
  );
}
