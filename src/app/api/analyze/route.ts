import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || GOOGLE_VISION_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // 1. Google Cloud Vision API 호출
    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;
    const base64Data = image.split(',')[1] || image; // Data URI 헤더 제거

    const visionResponse = await fetch(visionApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Data },
            features: [{ type: 'LABEL_DETECTION', maxResults: 10 }],
          },
        ],
      }),
    });

    const visionData = await visionResponse.json();

    if (!visionResponse.ok || visionData.error) {
      console.error('Vision API Error:', visionData.error);
      return NextResponse.json({ error: 'Failed to analyze image with Vision API' }, { status: 500 });
    }

    const labels = visionData.responses[0]?.labelAnnotations || [];
    const labelDescriptions = labels.map((label: any) => label.description);

    if (labelDescriptions.length === 0) {
      return NextResponse.json({ error: 'No objects detected' }, { status: 404 });
    }

    // 2. Supabase DB에서 모든 꽃 정보 가져와서 자바스크립트에서 유연하게 매칭 (대소문자 무시, 부분 일치)
    const { data: flowers, error: dbError } = await supabase
      .from('flowers')
      .select('*');

    if (dbError) {
      console.error('Database Error:', dbError);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    console.log("🔍 구글 비전 API가 추출한 라벨들: ", labelDescriptions);

    let matchedFlower = null;

    if (flowers) {
      // Vision API가 높은 정확도(Confidence) 순으로 응답하므로, 라벨을 순서대로 돌면서 DB 항목과 매칭
      for (const label of labelDescriptions) {
        const lowerLabel = label.toLowerCase();
        const found = flowers.find(f => 
          lowerLabel.includes(f.english_name.toLowerCase()) || 
          lowerLabel === f.english_name.toLowerCase()
        );
        if (found) {
          matchedFlower = found;
          break;
        }
      }
    }

    if (matchedFlower) {
      return NextResponse.json({ flower: matchedFlower });
    } 
    
    // 3. 매칭되지 않은 경우 Gemini API를 통해 데이터 동적 생성
    // 구체적인 식물의 종류를 파악하기 위해 상위 7개의 라벨을 모두 제공합니다.
    const keywordsLog = labelDescriptions.slice(0, 7).join(', ');
    
    try {
      const geminiPrompt = `너는 전 세계 모든 수종과 식물을 꿰뚫고 있는 전문 식물학자야. 비전 API가 분석한 키워드와 사진의 맥락을 보고, 이 식물이 '나무인지, 꽃인지, 아니면 실내 관엽식물인지' 먼저 판단한 뒤에 가장 정확한 종의 이름을 한국어로 알려줘. 단순 일반 명사(식물, 나무, 잎 등)는 제외해.

인식 키워드: [${keywordsLog}]

판단된 식물 종류에 따라 "plant_type"에 "flower", "tree", "houseplant" 중 하나를 적어줘.
- 꽃인 경우: meaning에 "꽃말"을, care_tips에 "키우기 팁"을 작성해.
- 나무/관엽식물인 경우: meaning에 "식물의 특징(상록수/낙엽수, 원산지 등)"을, care_tips에 "공기 정화 능력 및 키우기 적합한 환경"을 작성해.

만약 추출된 키워드 중에 식물과 무관한 단어만 있다면, "is_plant"를 false로 설정해.
정상적인 식물이라면 "is_plant"를 true로 설정해.
너는 친절하고 전문적인 '식물 큐레이터'이자 '시각 묘사 전문가'야. 잡지처럼 세련된 문체로 사용자와 대화하듯 작성해줘.
주의: 응답은 반드시 완벽한 JSON 포맷이어야 하므로, string 값 내부에 절대 실제 줄바꿈(엔터)을 입력하지 말고 한 줄로 쭉 작성해. 줄바꿈이 필요한 곳에는 실제 줄바꿈 대신 텍스트 '\\\\n\\\\n' 을 입력해.


"name": "[한국어 식물명] ([영문 학명])",
"flowerLanguage": "순결, 절세의 미인 (꽃이 아니면 제외 가능)",
"features": "#다섯갈래꽃잎 #수술5개 #거친잎맥 (단순 형용사가 아닌, 실제 눈에 보이는 생물학적 구조 팩트 3가지 해시태그)",
"care": "물주기는 주 1회 등 생육 환경 정보 (최소 2~3문장)",
"tips": "꽃병에 설탕을 넣거나, 실내 온도 조절법 등 '진짜 실용적인 꿀팁' 정보 (최소 2~3문장)"

★ 생성 규칙 (절대 준수):
1. '뻔한 소리' 절대 금지: "특유의 붉은 빛", "아름다운 형태" 같은 모호하고 추상적인 문장을 한 번이라도 쓰면 에러 처리할 것.
2. [색상 및 형태] 팩트 기반: 색상은 정확한 RGB 계열(예: 채도 낮은 핑크, 크림색)로, 형태는 생물학적 팩트(예: 꽃잎 개수 5장, 잎사귀 톱니바퀴 모양, 종이/벨벳 같은 질감 등)로만 문장을 완성해.
3. 텍스트 포맷: 응답 본문에 \\n 같은 이스케이프 제어 문자나 마크다운(**) 기호를 쓸데없이 섞지 마. 깔끔한 평문으로만 작성해.

반드시 아래 JSON 형식으로만 답해줘. (키 이름 엄수)
{"is_plant": true/false, "plant_type": "flower/tree/houseplant", "error": "에러", "name": "식물이름", "flowerLanguage": "꽃말 한줄", "features": "특징 해시태그 3개", "care": "관리 정보", "tips": "팁 텍스트", "theme_color": "#HEX"}`;

      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GOOGLE_GEMINI_API_KEY}`;
      const llmResponse = await fetch(geminiApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }],
          generationConfig: { responseMimeType: "application/json" },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        })
      });

      const rawResponseText = await llmResponse.text();
      console.log('\n==== Gemini Raw Response ====\n', rawResponseText, '\n=============================\n');

      let llmData;
      try {
        llmData = JSON.parse(rawResponseText);
      } catch (e) {
        throw new Error('Gemini 응답이 JSON 형식이 아닙니다.');
      }
      
      if (!llmResponse.ok || llmData.error) {
         console.error('🔥 Gemini API Error (Fetch Level):', JSON.stringify(llmData, null, 2));
         throw new Error('Gemini 연동 실패');
      }

      const candidate = llmData.candidates?.[0];
      if (!candidate || !candidate.content) {
         console.error('🔥 Gemini API No Candidates / Blocked:', JSON.stringify(llmData, null, 2));
         throw new Error('Gemini 응답 거부 또는 비정상 포맷');
      }

      const generatedText = candidate.content.parts[0].text || '';
      
      let aiFlowerData;
      try {
        // 혹시라도 백틱 포맷 마크다운이 넘어올 경우를 대비한 클리닝
        let cleanJsonStr = generatedText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // 실제 원시 엔터(에러 유발) 클렌징
        cleanJsonStr = cleanJsonStr.replace(/\r/g, '').replace(/\n/g, ' ');
        // 텍스트로 들어간 이스케이프 줄바꿈(\n) 및 마크다운 기호 완전히 제거
        cleanJsonStr = cleanJsonStr.replace(/\\n/g, ' ');
        cleanJsonStr = cleanJsonStr.replace(/\*\*/g, '');

        aiFlowerData = JSON.parse(cleanJsonStr);
      } catch (parseError) {
        console.error('🔥 Gemini 응답 JSON 파싱 에러. 원본 텍스트:\n', generatedText);
        throw new Error('Gemini 응답 JSON 포맷 에러');
      }

      // 식물이 아닌 경우의 예외 처리
      if (aiFlowerData.is_plant === false || aiFlowerData.error) {
        return NextResponse.json({ error: aiFlowerData.error || '식물을 찾을 수 없습니다' }, { status: 400 });
      }

      // 반환된 데이터 DB에 자동 캐싱(Insert). (필수 컬럼 NOT NULL 제약 대비 기본값 설정)
      // 프론트엔드 최적화 UI로 넘길 최종 모델 객체
      const responsePayload = {
        name: aiFlowerData?.name || '알 수 없는 식물',
        flowerLanguage: aiFlowerData?.flowerLanguage || '',
        features: aiFlowerData?.features || '#식물',
        care: aiFlowerData?.care || '적절한 빛과 물이 필요합니다.',
        tips: aiFlowerData?.tips || '사랑으로 키워주세요.',
        themeColor: aiFlowerData?.theme_color || '#E8E8E8',
        plantType: aiFlowerData?.plant_type || 'flower'
      };

      // Supabase 캐시용 모델 (하위 호환성 유지)
      const newFlowerData = {
        english_name: aiFlowerData?.features || labelDescriptions[0] || 'Unknown',
        name: responsePayload.name,
        meaning: `${responsePayload.flowerLanguage} ${responsePayload.features}`,
        care_tips: `${responsePayload.care} ${responsePayload.tips}`,
        theme_color: responsePayload.themeColor,
        plant_type: responsePayload.plantType
      };

      const { error: insertError } = await supabase
        .from('flowers')
        .insert([newFlowerData]);

      if (insertError) {
        console.error('Supabase Insert Error:', insertError);
      }

      return NextResponse.json({ 
        flower: responsePayload,
      });

    } catch (llmError: any) {
      console.error('🔥 LLM API/Parse RuntimeError:', llmError?.message || llmError);
      return NextResponse.json({ 
        error: '사용자가 너무 많아 잠시 쉬고 있어요. 1분 뒤에 다시 시도해 주세요!',
        labels: labelDescriptions.slice(0, 5)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
