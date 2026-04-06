"use client";

import React, { useState } from 'react';
import CameraCapture from '@/components/CameraCapture';
import ScanningAnimation from '@/components/ScanningAnimation';
import FlowerCard from '@/components/FlowerCard';

type Step = 'camera' | 'scanning' | 'result';

interface FlowerInfo {
  name: string;
  flowerLanguage: string;
  features: string;
  care: string;
  tips: string;
  themeColor: string;
  plantType: string;
}

export default function Home() {
  const [step, setStep] = useState<Step>('camera');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [flowerData, setFlowerData] = useState<FlowerInfo | null>(null);

  const handleImageCapture = async (file: File) => {
    // 1. Create a local preview URL
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setStep('scanning');

    // 1.5 Caching Check
    const cacheKey = `flower_cache_${file.name}_${file.size}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setFlowerData(parsed);
        setTimeout(() => setStep('result'), 1000); // 1초 가짜 딜레이 감성
        return;
      } catch (e) {}
    }

    try {
      // 2. Resize Image via Canvas
      const bmp = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1000;
      let width = bmp.width;
      let height = bmp.height;

      if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(bmp, 0, 0, width, height);
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);

      // 3. Call actual API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await response.json();

      if (response.ok && data.flower) {
        const finalData = {
          name: data.flower.name,
          flowerLanguage: data.flower.flowerLanguage,
          features: data.flower.features,
          care: data.flower.care,
          tips: data.flower.tips,
          themeColor: data.flower.themeColor,
          plantType: data.flower.plantType || 'flower',
        };
        setFlowerData(finalData);
        localStorage.setItem(cacheKey, JSON.stringify(finalData)); // 스토리지 캐싱
        setStep('result');
      } else {
        const labelHint = data.labels ? `\n(인식된 키워드: ${data.labels.join(', ')})` : '';
        alert(`식물을 인식하지 못했습니다: ${data.error || 'Unknown Error'}${labelHint}`);
        setStep('camera');
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
      setStep('camera');
    }
  };

  const handleReset = () => {
    setStep('camera');
    setImagePreview(null);
    setFlowerData(null);
  };

  const handleMockTest = () => {
    setFlowerData({
      name: '왕벚나무 (Prunus yedoensis)',
      flowerLanguage: '절세의 미인, 순결',
      features: '#연분홍색 #다섯갈래꽃잎 #풍성한꽃개화',
      care: '햇빛을 좋아하고 배수가 잘되는 사양토에서 잘 자랍니다. 개화기 전후로 물을 충분히 주세요.',
      tips: '봄꽃의 낭만을 상징합니다. 꽃잎이 얇아 비바람에 금방 떨어지므로 절정일 때 사진을 많이 찍어두세요.',
      themeColor: '#FFB7C5',
      plantType: 'flower',
    });
    setImagePreview('/sample-flower.jpg'); // dummy valid string so UI render won't break
    setStep('result');
  };

  return (
    <main>
      {step === 'camera' && (
        <CameraCapture onImageCapture={handleImageCapture} onMockTest={handleMockTest} />
      )}
      
      {step === 'scanning' && imagePreview && (
        <ScanningAnimation imagePreview={imagePreview} />
      )}

      {step === 'result' && flowerData && imagePreview && (
        <FlowerCard 
          flower={flowerData} 
          imageUrl={imagePreview} 
          onReset={handleReset} 
        />
      )}
    </main>
  );
}
