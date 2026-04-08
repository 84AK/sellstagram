# 가상 공간 + 펫 게이미피케이션 시스템 구현 가이드

> Next.js 15 App Router + Supabase 기반의 가상 방 꾸미기 & 펫 육성 시스템  
> 이 문서를 따라 어떤 앱에도 동일한 시스템을 적용할 수 있습니다.

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [기술 스택](#2-기술-스택)
3. [데이터베이스 설계](#3-데이터베이스-설계)
4. [파일 구조](#4-파일-구조)
5. [ASSETS 정의 (데이터 설계)](#5-assets-정의-데이터-설계)
6. [SVG 캐릭터 스프라이트 시스템](#6-svg-캐릭터-스프라이트-시스템)
7. [가상 방 캔버스 (RoomCanvas)](#7-가상-방-캔버스-roomcanvas)
8. [API Routes](#8-api-routes)
9. [CSS 애니메이션](#9-css-애니메이션)
10. [게이미피케이션 설계 원칙](#10-게이미피케이션-설계-원칙)
11. [구현 순서 체크리스트](#11-구현-순서-체크리스트)
12. [주요 버그 및 해결법](#12-주요-버그-및-해결법)

---

## 1. 시스템 개요

### 핵심 기능
| 기능 | 설명 |
|------|------|
| 가상 방 꾸미기 | 이모지 기반 가구/소품을 드래그 앤 드롭으로 배치 |
| 테마 선택 | 6가지 방 테마 (바닥색·벽색·몰딩색 일괄 변경) |
| 펫 입양 | 게시글 수에 따라 잠금 해제되는 12종 펫 |
| 펫 성장 | 경험치 → 아기→청소년→어른→특별 단계 성장 |
| 먹이 시스템 | 앱/게시글 등록 시 랜덤 먹이 보상 지급 |
| 스탯 관리 | 배고픔·행복도 시간 경과에 따라 자동 감소 |
| 펫 자율 이동 | requestAnimationFrame 기반 2D 자율 이동 |
| 관리자 권한 | 게시글 수 제한·슬롯 제한 없이 모든 펫 입양 가능 |

### 게이미피케이션 루프
```
콘텐츠 등록 (앱/프롬프트)
    ↓
랜덤 먹이 보상 지급 (reward_logs로 중복 방지)
    ↓
먹이로 펫에게 밥 주기 → EXP 획득 → 성장
    ↓
행복도 상승 → 행복 애니메이션
    ↓
시간 경과 → 배고픔·행복도 감소 → 다시 콘텐츠 등록 유도
```

---

## 2. 기술 스택

- **프레임워크**: Next.js 15 App Router
- **인증/DB**: Supabase (PostgreSQL + RLS)
- **언어**: TypeScript
- **스타일**: Tailwind CSS v4
- **아이콘**: Lucide React
- **캐릭터**: 순수 SVG (외부 이미지 없음)
- **애니메이션**: CSS keyframes + requestAnimationFrame

---

## 3. 데이터베이스 설계

### 3-1. room_items 테이블
```sql
CREATE TABLE room_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  asset_id   text NOT NULL,          -- ASSETS 배열의 id
  pos_x      float NOT NULL DEFAULT 50,  -- % 단위
  pos_y      float NOT NULL DEFAULT 60,
  z_idx      integer NOT NULL DEFAULT 2, -- 1=바닥 2=중간 3=벽
  item_scale float NOT NULL DEFAULT 1.0,
  flip_x     boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE room_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view room items" ON room_items FOR SELECT USING (true);
CREATE POLICY "Owner can manage room items" ON room_items FOR ALL USING (auth.uid() = user_id);
```

### 3-2. room_character 테이블 (방 설정)
```sql
CREATE TABLE room_character (
  user_id    uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  skin       text NOT NULL DEFAULT 'beige',
  hair       text NOT NULL DEFAULT 'brown',
  outfit     text NOT NULL DEFAULT 'blue',
  anim       text NOT NULL DEFAULT 'idle',
  pos_x      float NOT NULL DEFAULT 50,
  pos_y      float NOT NULL DEFAULT 65,
  room_theme text NOT NULL DEFAULT 'cozy',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE room_character ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view character" ON room_character FOR SELECT USING (true);
CREATE POLICY "Owner can manage character" ON room_character FOR ALL USING (auth.uid() = user_id);
```

### 3-3. pets 테이블
```sql
CREATE TABLE pets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pet_type     text NOT NULL DEFAULT 'cat',
  name         text,
  exp          integer NOT NULL DEFAULT 0,
  level        integer NOT NULL DEFAULT 1,
  hunger       integer NOT NULL DEFAULT 80,   -- 0~100
  happiness    integer NOT NULL DEFAULT 70,   -- 0~100
  growth_stage text NOT NULL DEFAULT 'baby',  -- baby|young|adult|special
  pos_x        float NOT NULL DEFAULT 50,
  pos_y        float NOT NULL DEFAULT 60,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pets"  ON pets FOR SELECT USING (true);
CREATE POLICY "Owner can insert pets" ON pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update pets" ON pets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete pets" ON pets FOR DELETE USING (auth.uid() = user_id);
```

### 3-4. pet_items 테이블 (먹이 인벤토리)
```sql
CREATE TABLE pet_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_type  text NOT NULL,
  quantity   integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_type)
);

ALTER TABLE pet_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can view own items"   ON pet_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert items"     ON pet_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update items"     ON pet_items FOR UPDATE USING (auth.uid() = user_id);
```

### 3-5. reward_logs 테이블 (중복 보상 방지)
```sql
CREATE TABLE reward_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  source_type  text NOT NULL,   -- 'app' | 'prompt'
  source_id    text NOT NULL,   -- 앱/프롬프트 id
  item_type    text NOT NULL,
  quantity     integer NOT NULL DEFAULT 1,
  rewarded_at  timestamptz DEFAULT now()
);

ALTER TABLE reward_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can view reward logs" ON reward_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert reward logs" ON reward_logs FOR INSERT WITH CHECK (true);
```

---

## 4. 파일 구조

```
components/
  room/
    ASSETS.ts          ← 모든 데이터 정의 (가구, 펫, 먹이, 테마 등)
    PetSprite.tsx      ← 순수 SVG 펫 캐릭터 컴포넌트
    CharacterSprite.tsx ← 사용자 캐릭터 SVG 컴포넌트
    RoomCanvas.tsx     ← 메인 방 캔버스 (모든 인터랙션 처리)

app/api/
  room/route.ts        ← 방 아이템 CRUD
  pets/route.ts        ← 펫 입양·수정·삭제
  pet-items/route.ts   ← 먹이 인벤토리 조회·사용
  pet-rewards/route.ts ← 게시글 등록 시 먹이 보상 지급

supabase/migrations/
  20260406_room_system.sql
  20260406_pet_system.sql
```

---

## 5. ASSETS 정의 (데이터 설계)

`ASSETS.ts`는 시스템의 핵심 데이터 파일. 서버·클라이언트 양쪽에서 import.

### 5-1. 카테고리 타입
```typescript
export type AssetCategory = 'furniture' | 'tech' | 'plants' | 'deco' | 'music';

export interface Asset {
  id: string;
  label: string;
  emoji: string;
  category: AssetCategory;
  defaultScale: number;
  defaultZ: number; // 1=floor 2=mid 3=wall
}
```

### 5-2. 펫 타입 정의
```typescript
export interface PetType {
  id: string;
  label: string;
  emoji: string;
  unlockAt: number;   // 잠금 해제에 필요한 게시글 수
  body: string;       // SVG 색상 (hex)
  accent: string;
  eye: string;
}

export const PET_TYPES: PetType[] = [
  // 기본 동물 펫 (게시글 수로 잠금 해제)
  { id: 'cat',     label: '고양이', emoji: '🐱', unlockAt: 0,    ... },
  { id: 'dog',     label: '강아지', emoji: '🐶', unlockAt: 5,    ... },
  { id: 'rabbit',  label: '토끼',   emoji: '🐰', unlockAt: 10,   ... },
  { id: 'fox',     label: '여우',   emoji: '🦊', unlockAt: 20,   ... },
  { id: 'panda',   label: '판다',   emoji: '🐼', unlockAt: 35,   ... },
  { id: 'unicorn', label: '유니콘', emoji: '🦄', unlockAt: 60,   ... },
  { id: 'dragon',  label: '드래곤', emoji: '🐉', unlockAt: 100,  ... },
  // AI 테마 특별 펫 (고잠금, 앱 정체성과 연결)
  { id: 'pixel',   label: '픽셀',   emoji: '🌈', unlockAt: 150,  ... },
  { id: 'vibe',    label: '바이브', emoji: '☁️',  unlockAt: 200,  ... },
  { id: 'byte',    label: '바이트', emoji: '🐛', unlockAt: 350,  ... },
  { id: 'prompy',  label: '프롬피', emoji: '💬', unlockAt: 600,  ... },
  { id: 'claudy',  label: '클로디', emoji: '🤖', unlockAt: 1000, ... },
];
```

### 5-3. 먹이 아이템
```typescript
export interface PetItem {
  id: string;
  label: string;
  emoji: string;
  hungerUp: number;     // 배고픔 회복량
  happinessUp: number;  // 행복도 회복량
  exp: number;          // 경험치
}

export const PET_ITEMS: PetItem[] = [
  { id: 'apple',  label: '사과', emoji: '🍎', hungerUp: 20, happinessUp: 5,  exp: 5  },
  { id: 'snack',  label: '간식', emoji: '🍖', hungerUp: 12, happinessUp: 20, exp: 6  },
  { id: 'salmon', label: '연어', emoji: '🍣', hungerUp: 40, happinessUp: 15, exp: 15 },
  { id: 'cookie', label: '쿠키', emoji: '🍪', hungerUp: 10, happinessUp: 15, exp: 3  },
  { id: 'milk',   label: '우유', emoji: '🥛', hungerUp: 15, happinessUp: 10, exp: 2  },
];
```

### 5-4. 성장 단계
```typescript
export interface GrowthStage {
  id: 'baby' | 'young' | 'adult' | 'special';
  label: string;
  minExp: number;
  scale: number;  // 렌더링 크기 배율
}

export const GROWTH_STAGES: GrowthStage[] = [
  { id: 'baby',    label: '🥚 아기',   minExp: 0,  scale: 0.6 },
  { id: 'young',   label: '🌱 청소년', minExp: 16, scale: 0.8 },
  { id: 'adult',   label: '🌟 어른',   minExp: 41, scale: 1.0 },
  { id: 'special', label: '✨ 특별',   minExp: 81, scale: 1.2 },
];

export function getGrowthStage(exp: number): GrowthStage {
  return [...GROWTH_STAGES].reverse().find(s => exp >= s.minExp) ?? GROWTH_STAGES[0];
}
```

### 5-5. 방 테마
```typescript
export const ROOM_THEMES = [
  { id: 'cozy',   label: '🏠 아늑',   floor: '#c8a87a', wall: '#f5e6d3', skirting: '#a07850' },
  { id: 'modern', label: '🏢 모던',   floor: '#7a6a5a', wall: '#e8e8e8', skirting: '#5a4a3a' },
  { id: 'pastel', label: '🌸 파스텔', floor: '#d4a8c8', wall: '#fce4ec', skirting: '#b088a8' },
  { id: 'forest', label: '🌿 자연',   floor: '#6a8c5a', wall: '#e8f5e9', skirting: '#4a6c3a' },
  { id: 'night',  label: '🌙 나이트', floor: '#2d3748', wall: '#1a202c', skirting: '#1a2030' },
  { id: 'ocean',  label: '🌊 오션',   floor: '#5a8aaa', wall: '#e3f2fd', skirting: '#3a6a8a' },
];
```

---

## 6. SVG 캐릭터 스프라이트 시스템

### 6-1. 설계 원칙

모든 캐릭터는 **viewBox="0 0 130 90"** 기준 순수 SVG.  
외부 이미지·라이브러리 없이 100% 코드로 구현 → 로딩 빠름, 커스터마이징 쉬움.

```typescript
export type PetAnim = 'idle' | 'walk' | 'eat' | 'happy' | 'sleep' | 'curious' | 'sad';

interface PetSpriteProps {
  type: string;
  anim?: PetAnim;
  size?: number;
  growthScale?: number;
}
```

### 6-2. 캐릭터 타입 분류

| 타입 | 대상 | 특징 |
|------|------|------|
| 4족 보행 | cat, dog, rabbit, fox, panda, unicorn, dragon | `pet-leg-a/b` 4개 다리, 꼬리 `pet-tail` |
| 2족 보행 | pixel, byte, claudy | `pet-leg-a/b` 2개 다리 |
| 공중 부유 | vibe, prompy | 다리 없음, CSS float 애니메이션 |

### 6-3. 다리 애니메이션 구조 (핵심)

4족/2족 보행 공통 패턴:

```tsx
{/* 뒤 다리 쌍 (어두운 색) */}
<g className="pet-leg-b">
  <rect x="83" y="71" width="10" height="19" rx="5" fill={c.dark}/>
</g>
<g className="pet-leg-a">
  <rect x="49" y="71" width="10" height="18" rx="5" fill={c.dark}/>
</g>

{/* ... 몸통, 머리 렌더링 ... */}

{/* 앞 다리 쌍 (밝은 색 — 앞에 렌더링되어 겹침) */}
<g className="pet-leg-b">
  <rect x="55" y="71" width="10" height="18" rx="5" fill={c.body}/>
</g>
<g className="pet-leg-a">
  <rect x="89" y="71" width="10" height="19" rx="5" fill={c.body}/>
</g>
```

> **핵심**: `pet-leg-a`와 `pet-leg-b`를 대각선 쌍으로 묶으면  
> 자연스러운 걸음걸이 애니메이션이 자동으로 구현된다.

```css
/* 항상 적용 (transform-box로 자신의 bounding box 기준 회전) */
.pet-leg-a, .pet-leg-b {
  transform-box: fill-box;
  transform-origin: 50% 0%; /* 다리 상단(힙)이 회전 축 */
}
.pet-tail {
  transform-box: fill-box;
  transform-origin: 0% 100%; /* 꼬리 기부 */
}

/* 부모에 animate-pet-walk 클래스가 있을 때만 실행 */
.animate-pet-walk .pet-leg-a { animation: pet-leg-stride-a 0.4s ease-in-out infinite; }
.animate-pet-walk .pet-leg-b { animation: pet-leg-stride-b 0.4s ease-in-out infinite; }
.animate-pet-walk .pet-tail  { animation: pet-tail-sway    0.5s ease-in-out infinite; }
```

### 6-4. 공유 눈 컴포넌트

모든 동물 펫이 공유하는 `Eyes` 컴포넌트:

```tsx
function Eyes({ c, sleep, happy, sad, x1, x2, ey }: {
  c: C; sleep: boolean; happy: boolean; sad: boolean;
  x1: number; x2: number; ey: number;
}) {
  if (sleep) return ( /* Z자 눈 */ );
  if (sad)   return ( /* 눈물 방울 + 처진 눈 */ );
  if (happy) return ( /* 아치형 웃는 눈 */ );
  return ( /* 기본 : 흰 공막 + 컬러 홍채 + 검은 동공 + 하이라이트 */ );
}
```

### 6-5. 감정 표현 시스템

| anim 값 | 표현 | 트리거 조건 |
|---------|------|------------|
| `idle`    | 기본 대기 | 평상시 |
| `walk`    | 걸음 + 다리 움직임 | 목표 지점 이동 중 |
| `eat`     | 입 벌리고 먹기 | 먹이 주기 직후 1.4초 |
| `happy`   | 아치눈 + 점프 | 먹이 후 3.2초 / 행복도 75+ |
| `sleep`   | Z자 눈 + 처진 자세 | 배고픔 < 20 |
| `sad`     | 눈물 + 찡그림 + 입꼬리 ↓ | 행복도 < 30 |
| `curious` | 고개 기울임 | 랜덤 10% 확률 |

---

## 7. 가상 방 캔버스 (RoomCanvas)

### 7-1. 핵심 상태 구조

```typescript
type RoomItem = {
  id: string; asset_id: string;
  pos_x: number; pos_y: number; z_idx: number;
  item_scale: number; flip_x: boolean;
};

type PetState = {
  id: string; pet_type: string; name: string | null;
  exp: number; level: number; hunger: number; happiness: number;
  growth_stage: string; pos_x: number; pos_y: number;
  anim: PetAnim; flip: boolean;  // 클라이언트 전용
};

type PetWalkState = {
  x: number; y: number;
  targetX: number; targetY: number;
  flip: boolean;
  pauseUntil: number;
  eatUntil: number;
  happyUntil: number;
};
```

### 7-2. 펫 자율 이동 (requestAnimationFrame)

```typescript
// petsRef: React state와 별도로 항상 최신값 유지
const petsRef    = useRef<PetState[]>([]);
const petWalkRef = useRef<Map<string, PetWalkState>>(new Map());
const petRafRef  = useRef<number | null>(null);

// petsRef 동기화
useEffect(() => { petsRef.current = pets; }, [pets]);

// RAF 루프 — 마운트 시 1회만 실행
useEffect(() => {
  const SPEED = 0.13; // %/frame
  const tick = () => {
    const now = Date.now();
    const prev = petsRef.current;
    let changed = false;

    const next = prev.map(pet => {
      const ws = petWalkRef.current.get(pet.id);
      if (!ws) return pet;

      // 우선순위: eat > happy > 기본상태
      if (now < ws.eatUntil)   return { ...pet, anim: 'eat',   flip: ws.flip };
      if (now < ws.happyUntil) return { ...pet, anim: 'happy', flip: ws.flip };

      // 기본 애니메이션 결정
      const baseAnim: PetAnim =
        pet.hunger    < 20 ? 'sleep' :
        pet.happiness < 30 ? 'sad'   : 'idle';

      // 일시정지 중
      if (now < ws.pauseUntil) {
        if (pet.anim !== baseAnim || pet.flip !== ws.flip) {
          changed = true;
          return { ...pet, anim: baseAnim, flip: ws.flip };
        }
        return pet;
      }

      // 목표 지점 도달 → 새 목표 설정
      const dx = ws.targetX - ws.x;
      const dy = ws.targetY - ws.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1.5) {
        ws.pauseUntil = now + 1000 + Math.random() * 2500;
        ws.targetX = 8 + Math.random() * 84;
        ws.targetY = 54 + Math.random() * 16; // 바닥 영역만 (54~70%)
        // 가끔 행복 폭발
        if (pet.happiness > 75 && Math.random() < 0.15) ws.happyUntil = now + 1200;
        if (Math.random() < 0.1) return { ...pet, anim: 'curious', flip: ws.flip };
        changed = true;
        return { ...pet, anim: baseAnim, flip: ws.flip };
      }

      // 이동
      ws.x += (dx / dist) * SPEED;
      ws.y += (dy / dist) * SPEED;
      ws.flip = dx < 0;
      changed = true;
      return { ...pet, pos_x: ws.x, pos_y: ws.y, anim: 'walk', flip: ws.flip };
    });

    if (changed) setPets(next);
    petRafRef.current = requestAnimationFrame(tick);
  };

  petRafRef.current = requestAnimationFrame(tick);
  return () => { if (petRafRef.current) cancelAnimationFrame(petRafRef.current); };
}, []);
```

### 7-3. 스탯 자동 감소 (5분마다)

```typescript
useEffect(() => {
  if (!isOwner) return;
  const id = setInterval(() => {
    setPets(prev => {
      const updated = prev.map(p => ({
        ...p,
        hunger:    Math.max(0, p.hunger    - 2),
        happiness: Math.max(0, p.happiness - 1),
      }));
      petsRef.current = updated; // ref 동기화
      // DB 저장
      updated.forEach((p, i) => {
        if (prev[i].hunger !== p.hunger || prev[i].happiness !== p.happiness) {
          fetch('/api/pets', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: p.id, hunger: p.hunger, happiness: p.happiness }),
          }).catch(() => {});
        }
      });
      return updated;
    });
  }, 5 * 60 * 1000); // 5분
  return () => clearInterval(id);
}, [isOwner]);
```

### 7-4. Race Condition 방지 (중요)

**문제**: `adoptPet`에서 `setPets`를 호출해도 RAF 루프가 stale `petsRef.current`로
state를 덮어써 새 펫이 사라지는 현상.

**해결**: `petsRef.current`를 `setPets` **전에** 동기적으로 갱신.

```typescript
const adoptPet = async (pet_type: string) => {
  // ... API 호출 ...
  const newPet = { ...data, anim: 'idle', flip: false };

  // ✅ petsRef 먼저 동기 갱신 → RAF가 stale 값으로 덮어쓰기 방지
  const updatedPets = [...petsRef.current, newPet];
  petsRef.current = updatedPets;
  setPets(updatedPets);

  petWalkRef.current.set(data.id, { x: data.pos_x, y: data.pos_y, ... });
};

const releasePet = async (id: string) => {
  // ...
  const filtered = petsRef.current.filter(p => p.id !== id);
  petsRef.current = filtered; // ✅ 먼저 동기 갱신
  setPets(filtered);
};
```

### 7-5. 먹이 주기 + 시각 피드백

```typescript
const feedPet = async (petId: string, item_type: string) => {
  const ws = petWalkRef.current.get(petId);
  const pet = pets.find(p => p.id === petId);
  const itemDef = PET_ITEM_MAP[item_type];

  // 플로팅 이모지 효과
  const efId = ++feedEffectId.current;
  setFeedEffects(prev => [
    ...prev,
    { id: efId,     emoji: itemDef.emoji, x: pet.pos_x,      y: pet.pos_y - 8 },
    { id: efId + 1, emoji: '💖',           x: pet.pos_x + 4, y: pet.pos_y - 14 },
  ]);
  setTimeout(() => setFeedEffects(prev => prev.filter(e => e.id !== efId && e.id !== efId + 1)), 1600);

  // 먹기/행복 애니메이션 타이머
  if (ws) {
    ws.eatUntil   = Date.now() + 1400;
    ws.happyUntil = Date.now() + 3200;
  }
  setFeedingPetId(null);

  // API 호출
  const res = await fetch('/api/pet-items', {
    method: 'POST',
    body: JSON.stringify({ pet_id: petId, item_type }),
  });
  const result = await res.json();

  // 로컬 state 즉시 반영
  setPets(prev => prev.map(p => p.id === petId ? {
    ...p,
    hunger:       result.pet.hunger,
    happiness:    result.pet.happiness,
    exp:          result.pet.exp,
    level:        result.pet.level,
    growth_stage: result.pet.growth_stage,
  } : p));
};
```

---

## 8. API Routes

### 8-1. /api/pets

```
GET  ?owner_id=xxx  → 펫 목록 + 총 게시글 수 반환
POST body: { pet_type, name? } → 입양 (잠금 해제·슬롯 검사 포함)
PATCH body: { id, hunger?, happiness?, exp?, pos_x?, pos_y?, name? } → 스탯/위치 업데이트
DELETE ?id=xxx → 분양 보내기
```

**관리자 예외 처리**:
```typescript
const isAdmin = user.email === 'mosebb@gmail.com'; // 실제 관리자 이메일로 교체
if (!isAdmin) {
  // 게시글 수 잠금 해제 확인
  // 슬롯 4개 제한 확인
}
// 관리자는 제한 없이 모든 펫 입양 가능
```

### 8-2. /api/pet-items

```
GET  → 내 인벤토리 목록
POST body: { pet_id, item_type } → 먹이 사용 (인벤토리 -1, 펫 스탯 업, EXP 업)
```

### 8-3. /api/pet-rewards (게시글 등록 시 보상)

```typescript
// 등록 보상 확률 테이블
const REWARD_TABLE = [
  { item_type: 'apple',  weight: 35 },
  { item_type: 'cookie', weight: 30 },
  { item_type: 'snack',  weight: 20 },
  { item_type: 'milk',   weight: 15 },
];

// POST: 앱/프롬프트 등록 후 호출
// reward_logs 테이블로 같은 source_id 중복 지급 방지
```

**앱/프롬프트 등록 API에서 호출**:
```typescript
// 앱 등록 성공 후 클라이언트에서:
fetch('/api/pet-rewards', {
  method: 'POST',
  body: JSON.stringify({ source_type: 'app', source_id: appId }),
}).catch(() => {});

// 프롬프트 등록 성공 후 서버에서 (silent fail):
try {
  await grantPostReward(userId, 'prompt', promptId);
} catch { /* silent */ }
```

---

## 9. CSS 애니메이션

### 9-1. 전체 애니메이션 목록

```css
/* 기본 동작 */
@keyframes pet-idle    { /* 0→-5px 위아래 흔들 */ }
@keyframes pet-walk    { /* 위아래 + 좌우 흔들 */ }
@keyframes pet-eat     { /* 아래로 숙이기 */ }
@keyframes pet-happy   { /* 점프 + 회전 */ }
@keyframes pet-sleep   { /* 기울어진 채 미세 흔들 */ }
@keyframes pet-sad     { /* -5도 기울어진 채 처짐 */ }
@keyframes pet-curious { /* 18도 기울이기 */ }

/* 부유 타입 전용 (Vibe, Prompy) */
@keyframes pet-float      { /* 0→-9px 느린 부유 */ }
@keyframes pet-float-drift { /* -3→-13px 빠른 부유 */ }

/* 다리 보행 */
@keyframes pet-leg-stride-a { 0%,100% { rotate: -22deg } 50% { rotate: 22deg } }
@keyframes pet-leg-stride-b { 0%,100% { rotate:  22deg } 50% { rotate: -22deg } }
@keyframes pet-tail-sway    { 0%,100% { rotate: -18deg } 50% { rotate:  18deg } }

/* 먹이 플로팅 이펙트 */
@keyframes feedFloat {
  0%   { opacity: 1;   transform: translate(-50%, -50%)  scale(1);   }
  60%  { opacity: 1;   transform: translate(-50%, -180%) scale(1.3); }
  100% { opacity: 0;   transform: translate(-50%, -260%) scale(0.8); }
}
```

### 9-2. 부유 타입 vs 보행 타입 분기

```typescript
// PetSprite.tsx
const FLOAT_PETS = new Set(['vibe', 'prompy']);

const ac = FLOAT_PETS.has(type)
  ? { idle: 'animate-pet-float', walk: 'animate-pet-float-drift', ... }[anim]
  : { idle: 'animate-pet-idle',  walk: 'animate-pet-walk',        ... }[anim];
```

---

## 10. 게이미피케이션 설계 원칙

### 10-1. 잠금 해제 곡선 설계

| 펫 | 게시글 수 | 메시지 |
|----|----------|--------|
| 고양이 | 0 | 첫 시작 선물 |
| 강아지 | 5 | 입문 |
| 토끼 | 10 | 초보 달성 |
| 여우 | 20 | 활발한 사용자 |
| 판다 | 35 | 꾸준한 기여자 |
| 유니콘 | 60 | 헌신적 멤버 |
| 드래곤 | 100 | 파워 유저 |
| AI 특별 펫 | 150~1000 | 전설급 |

> **설계 포인트**: 잠금 해제 곡선이 앱의 핵심 액션(게시글 등록)과 직접 연결된다.  
> 앱마다 적절한 액션(팔로워 수, 리뷰 수, 구매 횟수 등)으로 교체.

### 10-2. 보상 루프 설계

```
액션 완료 → 즉시 피드백 (먹이 지급 토스트)
    ↓
인벤토리 확인 → 펫에게 먹이 주기
    ↓
시각적 피드백 (플로팅 이모지, 행복 애니메이션)
    ↓
EXP 획득 → 성장 단계 변화 (크기 증가)
    ↓
시간 경과 → 스탯 감소 → 다시 앱 사용 유도
```

### 10-3. 스탯 감소 속도 조절

| 간격 | 감소량 | 소진 시간 (80→0) |
|------|--------|----------------|
| 5분 | hunger -2 | ~3.3시간 |
| 5분 | happiness -1 | ~6.7시간 |

> 앱의 방문 주기에 맞게 조절. 매일 방문 앱이면 24시간 소진이 적합.

### 10-4. 관리자 권한

- 모든 잠금 해제 조건 무시
- 슬롯 제한(4마리) 무시
- 서버·클라이언트 양쪽에서 `user.email === 'admin@example.com'` 체크

---

## 11. 구현 순서 체크리스트

### Phase 1: DB 스키마
- [ ] `room_items` 테이블 생성 + RLS 설정
- [ ] `room_character` 테이블 생성 + RLS 설정
- [ ] `pets` 테이블 생성 + RLS 설정
- [ ] `pet_items` 테이블 생성 + RLS 설정
- [ ] `reward_logs` 테이블 생성 + RLS 설정

### Phase 2: 데이터 정의 (ASSETS.ts)
- [ ] `AssetCategory` 타입 정의
- [ ] `Asset[]` 배열 (가구, 테크, 식물, 데코, 음악)
- [ ] `ROOM_THEMES` 배열 (최소 3개)
- [ ] `PetType[]` 배열 (기본 + 특별 펫)
- [ ] `PetItem[]` 배열 (먹이 종류)
- [ ] `GrowthStage[]` + `getGrowthStage()` 함수

### Phase 3: SVG 캐릭터
- [ ] 각 펫 타입별 SVG 컴포넌트 작성
  - 4족 보행: `pet-leg-a/b` 그룹 + `pet-tail` 그룹 필수
  - 2족 보행: `pet-leg-a/b` 그룹 2개
  - 부유형: 다리 없음, `FLOAT_PETS` Set에 추가
- [ ] `Eyes` 공유 컴포넌트 (idle/happy/sleep/sad 상태)
- [ ] `PetSprite` 메인 컴포넌트 (type → SVG 디스패치)

### Phase 4: CSS 애니메이션
- [ ] `globals.css`에 모든 `@keyframes` 추가
- [ ] `.pet-leg-a/b { transform-box: fill-box; transform-origin: 50% 0%; }` 추가
- [ ] `.pet-tail { transform-box: fill-box; transform-origin: 0% 100%; }` 추가
- [ ] `.animate-pet-walk .pet-leg-*` 연결 셀렉터 추가
- [ ] `@keyframes feedFloat` 추가

### Phase 5: API Routes
- [ ] `GET/POST/PATCH/DELETE /api/pets`
- [ ] `GET/POST /api/pet-items`
- [ ] `POST /api/pet-rewards`
- [ ] `GET/POST/PATCH/DELETE /api/room`

### Phase 6: RoomCanvas 컴포넌트
- [ ] 방 배경 렌더링 (wall/floor 비율, 몰딩선)
- [ ] 가구 드래그 앤 드롭 배치
- [ ] z-index 기반 렌더링 순서 (z_idx + pos_y)
- [ ] RAF 기반 펫 자율 이동 루프
- [ ] `petsRef` 동기 갱신 (race condition 방지)
- [ ] 스탯 자동 감소 타이머
- [ ] 먹이 주기 + 플로팅 이펙트
- [ ] 부유 타입 펫 float 애니메이션 분기

### Phase 7: 보상 연결
- [ ] 앱 등록 API에서 `/api/pet-rewards` 호출 (클라이언트)
- [ ] 프롬프트 등록 API에서 `grantPostReward()` 호출 (서버사이드)
- [ ] 첫 펫 입양 시 스타터 아이템 지급

---

## 12. 주요 버그 및 해결법

### Bug 1: RAF Race Condition — 새 펫이 즉시 사라짐
**원인**: `setPets(prev => [...prev, newPet])` 호출 후 RAF 루프가 stale `petsRef.current`로 state를 덮어씀.  
**해결**:
```typescript
// ❌ 틀린 방법
setPets(prev => [...prev, newPet]);

// ✅ 올바른 방법
const updated = [...petsRef.current, newPet];
petsRef.current = updated; // 먼저 ref 갱신
setPets(updated);
```

### Bug 2: SVG 다리 애니메이션이 작동 안 함
**원인**: `transform-box: fill-box`가 인라인 스타일에 있으면 CSS 클래스에서 override됨.  
**해결**: `transform-box`와 `transform-origin`을 **CSS 클래스**로만 정의, 인라인 style에 쓰지 않음.

### Bug 3: 총 게시글 수가 항상 0
**원인**: `apps` / `prompts` 테이블 쿼리 시 컬럼명이 `user_id`가 아닌 `created_by`.  
**해결**: `.eq('created_by', owner_id)` 사용. 실제 테이블 스키마 확인 필수.

### Bug 4: 구글 드라이브 이미지 저해상도
**원인**: `drive.google.com/thumbnail?id=X` 기본 해상도 220px.  
**해결**: URL에 `&sz=w1600` 파라미터 추가.

### Bug 5: 이미지 최적화 문제 (Next.js)
**원인**: `unoptimized` prop 남발.  
**해결**: `next.config.ts`에 `images: { remotePatterns: [{ hostname: '**' }] }` 설정 → 모든 도메인 최적화 가능.

---

## 부록: 앱 맞춤 커스터마이징 포인트

| 항목 | 기본값 | 커스터마이징 방법 |
|------|--------|----------------|
| 잠금 해제 조건 | 게시글 수 | `unlockAt` 값 변경 / `totalPosts` 계산 로직 교체 |
| 먹이 보상 트리거 | 앱/프롬프트 등록 | 구매 완료, 리뷰 작성, 팔로워 달성 등으로 교체 |
| 스탯 감소 속도 | 5분마다 hunger-2, happiness-1 | `DECAY_INTERVAL` 및 감소량 조절 |
| 펫 슬롯 수 | 4마리 | API와 클라이언트 `pets.length >= 4` 조건 변경 |
| 방 테마 | 6종 | `ROOM_THEMES` 배열에 추가/변경 |
| 캐릭터 종류 | 12종 | `PET_TYPES` 배열에 추가 (SVG 컴포넌트 별도 작성) |
| 관리자 이메일 | mosebb@gmail.com | API route의 `isAdmin` 조건 변경 |
| 바닥 위치 | 55% | 배경 gradient + `targetY` 범위 동시 조정 |

---

*문서 작성일: 2026-04-06*  
*기반 프로젝트: AI Service Site (vibe_coding)*  
*구현 환경: Next.js 15 + Supabase + TypeScript*
