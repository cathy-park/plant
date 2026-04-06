-- Supabase SQL Editor에서 실행하여 테이블을 생성하세요.

CREATE TABLE IF NOT EXISTS public.flowers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  english_name text UNIQUE NOT NULL,
  name text NOT NULL,
  meaning text NOT NULL,
  care_tips text,
  theme_color text NOT NULL
);

-- 예제 데이터 삽입 (테스트용)
INSERT INTO public.flowers (english_name, name, meaning, care_tips, theme_color) VALUES 
('Sunflower', '해바라기', '프라이드, 일편단심, 당신만을 바라봅니다.', '햇빛을 아주 좋아해요. 하루 종일 해가 잘 드는 곳에 두고, 겉흙이 마르면 물을 흠뻑 주세요.', '#FFD700'),
('Rose', '장미', '열렬한 사랑, 기쁨, 아름다움', '햇빛이 잘 드는 곳에서 키우고 평소에 흙이 조금 말랐을 때 물을 듬뿍 주면 좋습니다. 진딧물에 주의하세요.', '#E32636'),
('Tulip', '튤립', '사랑의 고백, 매혹, 영원한 애정', '서늘한 기후에서 잘 자라며 알뿌리가 썩지 않도록 배수에 각별히 신경 써주세요.', '#FF878D')
ON CONFLICT (english_name) DO NOTHING;
