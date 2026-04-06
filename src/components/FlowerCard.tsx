"use client";

import React, { useState } from 'react';
import styles from '../styles/FlowerCard.module.css';
import { RefreshCcw, Search, Sparkles, Palette, Droplet, Lightbulb, Flower } from 'lucide-react';

export interface FlowerInfo {
  name: string;
  flowerLanguage: string;
  features: string;
  care: string;
  tips: string;
  themeColor: string;
  plantType: string;
}

interface FlowerCardProps {
  flower: FlowerInfo;
  imageUrl: string;
  onReset: () => void;
}

export default function FlowerCard({ flower, imageUrl, onReset }: FlowerCardProps) {
  


  return (
    <div 
      className={`${styles.cardContainer} animate-fade-in`}
      style={{ background: `linear-gradient(135deg, ${flower.themeColor}15 0%, var(--color-bg) 100%)` }}
    >
      <div className={styles.contentWrapper}>
        <div className={`${styles.imageBox} animate-fade-in`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={flower.name} />
        </div>

        <div className={`${styles.heroSection} animate-slide-up`}>
          <h1 className={styles.title}>{flower.name}</h1>
          {flower.flowerLanguage && (
            <p className={styles.flowerLanguage}><Flower size={16} /> {flower.flowerLanguage}</p>
          )}
        </div>

        <div className={`${styles.gridContainer} animate-slide-up`} style={{ animationDelay: '0.2s' }}>
          <div className={`${styles.infoCard} ${styles.fullWidthCard}`}>
            <div className={styles.cardHeader}>
              <Sparkles className={styles.cardIcon} size={20} />
              <h3>식물 특징</h3>
            </div>
            <p>{flower.features.replace(/\\n/g, ' ').replace(/\n/g, ' ')}</p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <Droplet className={styles.cardIcon} size={20} />
              <h3>생육 및 관리</h3>
            </div>
            <p>{flower.care.replace(/\\n/g, ' ').replace(/\n/g, ' ')}</p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <Lightbulb className={styles.cardIcon} size={20} />
              <h3>추가 팁</h3>
            </div>
            <p>{flower.tips.replace(/\\n/g, ' ').replace(/\n/g, ' ')}</p>
          </div>
        </div>

        <div className={`${styles.buttonWrapper} animate-slide-up`}>
          <a 
            href="https://lens.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.outlineLink}
            onClick={() => alert("구글 렌즈 사이트가 열리면 방금 촬영한 사진을 직접 업로드해 보세요! 가장 정확한 결과를 확인하실 수 있습니다.")}
          >
            <Search size={18} style={{ marginRight: '8px' }} />
            구글 렌즈로 더 정확하게 확인하기
          </a>
        </div>
      </div>

      <div className={styles.stickyButtonWrapper}>
        <button className={styles.backButton} onClick={onReset}>
          <RefreshCcw size={18} style={{ marginRight: '8px' }} />
          다른 식물 찾아보기
        </button>
      </div>
    </div>
  );
}
