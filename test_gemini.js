const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/GOOGLE_GEMINI_API_KEY=(.*)/);
const GOOGLE_GEMINI_API_KEY = match ? match[1].trim() : '';

async function testGemini() {
  const keywordsLog = "Flower, Petal, Green, Red, Garden roses";
  const geminiPrompt = `너는 전 세계 모든 수종과 식물을 꿰뚫고 있는 전문 식물학자야. 비전 API가 분석한 키워드와 사진의 맥락을 보고, 이 식물이 '나무인지, 꽃인지, 아니면 실내 관엽식물인지' 먼저 판단한 뒤에 가장 정확한 종의 이름을 한국어로 알려줘. 단순 일반 명사(식물, 나무, 잎 등)는 제외해.

인식 키워드: [${keywordsLog}]

판단된 식물 종류에 따라 "plant_type"에 "flower", "tree", "houseplant" 중 하나를 적어줘.
- 꽃인 경우: meaning에 "꽃말"을, care_tips에 "키우기 팁"을 작성해.
- 나무/관엽식물인 경우: meaning에 "식물의 특징(상록수/낙엽수, 원산지 등)"을, care_tips에 "공기 정화 능력 및 키우기 적합한 환경"을 작성해.

만약 추출된 키워드 중에 식물과 무관한 단어만 있다면, "is_plant"를 false로 설정해.
정상적인 식물이라면 "is_plant"를 true로 설정해.
너는 친절하고 전문적인 '식물 큐레이터'이자 '시각 묘사 전문가'야. 잡지처럼 세련된 문체로 사용자와 대화하듯 작성해줘.
주의: 응답은 반드시 완벽한 JSON 포맷이어야 하므로, string 값 내부에 절대 실제 줄바꿈(엔터)을 입력하지 말고 한 줄로 쭉 작성해. 줄바꿈이 필요한 곳에는 실제 줄바꿈 대신 텍스트 '\\\\n\\\\n' 을 입력해.

"meaning" 필드에는 아래 3개 항목을 텍스트 '\\\\n\\\\n' 로 구분해서 하나의 문자열로 작성해:
이 사진은 <strong>[한국어 식물 이름] ([영문 학명])</strong>의 [꽃/나무/잎]입니다. (반드시 <strong> 태그 사용)
✨ 특징: 유래나 모양의 비유 등 흥미로운 사실 한 줄.
🎨 색상: 사진 속 식물은 [분석된 실제 색상]을 띠고 있습니다. (비전 데이터를 참고하여 실제와 일치하게 작성)

"care_tips" 필드에는 아래 2개 항목을 텍스트 '\\\\n\\\\n' 로 구분해서 하나의 문자열로 작성해:
💧 관리: 생육 환경(빛, 습도 등) 핵심 정보.
💡 팁: 초보자를 위한 실용적인 조언이나 즐기는 법.

또한 결과가 틀렸을 때 검색을 위해 눈에 보이는 형태(예: 입술 모양, 별 모양, 잎 무늬 등)를 도출해서 결과를 "search_features" 필드에 해시태그 형식으로 띄어쓰기해서 작성해. (예: #입술모양 #강렬한레드 #열대식물)

반드시 아래 JSON 형식으로만 답해줘.
{"is_plant": true/false, "plant_type": "flower/tree/houseplant", "error": "에러", "name": "식물이름", "meaning": "첫문장+특징+색상 텍스트", "care_tips": "관리+팁 텍스트", "theme_color": "#HEX", "search_features": "형태적 특징 등 3가지"}`;

  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GOOGLE_GEMINI_API_KEY}`;
  
  try {
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
      console.log('--- RAW RESPONSE ---');
      console.log(rawResponseText);
      console.log('--------------------');
      
      let llmData = JSON.parse(rawResponseText);
      console.log('SUCCESS JSON PARSE outer');
      let x = llmData.candidates[0].content.parts[0].text;
      
      let aiFlowerData;
      try {
        let cleanJsonStr = x.replace(/```json/gi, '').replace(/```/g, '').trim();
        cleanJsonStr = cleanJsonStr.replace(/\r/g, '').replace(/\n/g, ' ');
        aiFlowerData = JSON.parse(cleanJsonStr);
        console.log("FINAL SUCCESS", aiFlowerData);
      } catch (e) {
        console.log("FINAL FAIL", e);
      }

  } catch(e) {
      console.error("ERROR:", e);
  }
}
testGemini();
