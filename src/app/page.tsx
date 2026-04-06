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
      name: '장미 (Rosa hybrida)',
      flowerLanguage: '열렬한 사랑, 아름다움, 질투',
      features: '#겹꽃 #강렬한레드 #벨벳질감꽃잎',
      care: '햇빛을 매우 좋아하며 통풍이 잘되는 곳에서 키워주세요. 겉흙이 말랐을 때 물을 듬뿍 주는 것이 좋습니다.',
      tips: '시든 꽃을 바로 잘라주면 새로운 꽃이 더 잘 피어납니다. 절화로 감상할 때는 물에 설탕을 살짝 넣으면 더 오래 볼 수 있어요.',
      themeColor: '#E11D48',
      plantType: 'flower',
    });
    setImagePreview('/sample-rose.jpg');
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
