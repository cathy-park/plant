-- Supabase SQL Editor에서 이 쿼리를 실행하여 기존 flowers 테이블을 업데이트하세요.
-- 꽃 외의 식물을 원활하게 분류하기 위해 식물 타입을 지정하는 컬럼을 추가합니다.

ALTER TABLE public.flowers 
ADD COLUMN IF NOT EXISTS plant_type text DEFAULT 'flower';

-- 🌿 팁: 
-- 추가된 plant_type에는 'flower', 'tree', 'houseplant', 'grass' 등의 값이 제미나이에 의해 들어가게 됩니다.
-- 기존 데이터들은 DEFAULT 값인 'flower'로 자동 설정되어 하위 호환성이 보장됩니다.
