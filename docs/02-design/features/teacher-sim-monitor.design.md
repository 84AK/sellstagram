# Design: teacher-sim-monitor

> 선생님 대시보드 시뮬레이션 결과 모니터링

**Created**: 2026-03-11
**Status**: Design Complete

---

## 1. 아키텍처 설계

### 데이터 흐름

```
[학생: /simulate 페이지]
     ↓ "결과 저장" 클릭
[POST /api/simulate/save-result]
     ↓ simulation_results INSERT
[Supabase Realtime: INSERT 이벤트]
     ↓
[선생님 /teacher 페이지]
     ↓ 실시간 수신
[UI: 결과 카드 + 팀 리더보드 업데이트]
```

---

## 2. 컴포넌트 설계

### 2-1. teacher/page.tsx 변경

#### Tab 타입 확장
```typescript
// 기존
type Tab = "class" | "feed" | "mission" | "shop" | "reward" | "weekly" | "teams";

// 변경
type Tab = "class" | "feed" | "mission" | "shop" | "reward" | "weekly" | "teams" | "simulation";
```

#### 새 상태 변수
```typescript
// 시뮬레이션 결과 목록
const [simResults, setSimResults] = useState<SimResult[]>([]);
const [isLoadingSimResults, setIsLoadingSimResults] = useState(false);
// 새 결과 알림
const [newResultAlert, setNewResultAlert] = useState<string | null>(null);
```

#### 새 인터페이스
```typescript
interface SimResult {
    id: string;
    user_name: string;
    user_handle: string;
    post_caption: string;
    post_image: string | null;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    total_purchases: number;
    total_revenue: number;
    duration_minutes: number;
    session_started_at: string;
    created_at: string;
}
```

### 2-2. 탭 네비게이션

기존 탭 목록에 "시뮬레이션" 탭 아이콘(TrendingUp) 추가:
```
수업현황 | 피드 | 미션 | 샵 | 보상 | 주간 | 팀 | 📊시뮬레이션  ← NEW
```

### 2-3. 시뮬레이션 탭 UI 레이아웃

```
┌─────────────────────────────────────────┐
│ 📊 마켓 시뮬레이션 결과                    │
│ 총 N개 결과 · 마지막 업데이트 00:00         │
├─────────────────────────────────────────┤
│ [팀별 매출 리더보드]                       │
│  🔥 A팀  ₩120,000  ████████████ 1위     │
│  ⚡ B팀  ₩95,000   ██████████   2위     │
│  🌊 C팀  ₩43,000   █████        3위     │
├─────────────────────────────────────────┤
│ [개별 결과 카드 - 최신순]                  │
│ ┌───────────────────────────────────┐   │
│ │ 홍길동 @hong  🔥A팀  2분 전         │   │
│ │ [게시물 이미지 썸네일]                │   │
│ │ "환경을 생각하는 당신을 위한..."       │   │
│ │  ❤️ 37  💬 6  🔗 3  🛍️ 1         │   │
│ │  매출: ₩10,000                    │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 3. Supabase Realtime 구독

```typescript
// teacher/page.tsx useEffect 내
const simChannel = supabase
    .channel("sim-results-monitor")
    .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "simulation_results" },
        (payload) => {
            const newResult = payload.new as SimResult;
            setSimResults(prev => [newResult, ...prev]);
            setNewResultAlert(`${newResult.user_name}님이 결과를 저장했어요! ₩${newResult.total_revenue.toLocaleString()}`);
            setTimeout(() => setNewResultAlert(null), 4000);
        }
    )
    .subscribe();
```

---

## 4. 팀 집계 로직

```typescript
// simResults에서 팀별 매출 계산
// profiles 테이블에서 handle → team 매핑 필요
const teamRevenue = simResults.reduce((acc, r) => {
    const team = handleToTeam[r.user_handle] ?? "미배정";
    acc[team] = (acc[team] ?? 0) + r.total_revenue;
    return acc;
}, {} as Record<string, number>);
```

---

## 5. DB Migration 필요 사항

`simulation_results` 테이블에 Realtime 활성화:
```sql
-- Supabase SQL Editor에서 실행
alter publication supabase_realtime add table public.simulation_results;
```

`simulation_results` 테이블이 없다면 생성:
```sql
create table if not exists public.simulation_results (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete set null,
    user_name text,
    user_handle text,
    post_id uuid,
    post_caption text,
    post_image text,
    session_started_at timestamptz,
    duration_minutes integer default 10,
    total_likes integer default 0,
    total_comments integer default 0,
    total_shares integer default 0,
    total_purchases integer default 0,
    total_revenue integer default 0,
    events jsonb,
    created_at timestamptz default now()
);

alter table public.simulation_results enable row level security;
create policy "sim_results_read" on public.simulation_results for select using (true);
create policy "sim_results_insert" on public.simulation_results for insert with check (true);

alter publication supabase_realtime add table public.simulation_results;
```

---

## 6. 구현 순서

1. `schema.sql`에 `simulation_results` 테이블 정의 추가
2. Supabase에서 Realtime 활성화 SQL 실행
3. `teacher/page.tsx` - SimResult 인터페이스 + 상태 추가
4. `teacher/page.tsx` - 초기 데이터 로드 (기존 결과)
5. `teacher/page.tsx` - Realtime 구독 설정
6. `teacher/page.tsx` - "simulation" 탭 추가
7. `teacher/page.tsx` - 탭 UI: 팀 리더보드 + 개별 결과 카드
8. `teacher/page.tsx` - 토스트 알림 UI

---

## 7. 파일 수정 목록

| 파일 | 변경 유형 | 내용 |
|------|---------|------|
| `src/app/teacher/page.tsx` | 수정 | 탭 추가, 상태 추가, Realtime 구독, UI |
| `docs/supabase-migration-join-code.sql` | 수정 | simulation_results 테이블 + Realtime |
| `src/lib/supabase/schema.sql` | 수정 | simulation_results 테이블 정의 추가 |
