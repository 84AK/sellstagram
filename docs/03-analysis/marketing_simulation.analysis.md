# Sellstagram Marketing Simulation - Gap Analysis Report

> **Analysis Type**: Gap Analysis / Code Quality / Security Analysis
> **Project**: marketing_simulation (Sellstagram)
> **Analyst**: Claude Code (gap-detector)
> **Date**: 2026-03-02
> **Overall Match Rate**: 76%

---

## 1. Feature Implementation Gap Analysis

| # | 기능 | 설계 의도 | 점수 | 주요 갭 |
|---|------|----------|:----:|---------|
| 1 | OAuth 인증 (Google + Kakao) | /login → /auth/callback → 온보딩 → 피드 | 85% | 학생 UI에 로그아웃 없음, 토큰 에러 핸들링 UI 없음 |
| 2 | 역할 분리 (student/teacher) | student: 피드, teacher: /teacher | 75% | 알려진 버그: teacher role DB 리디렉션 루프 |
| 3 | 게시물 업로드 (이미지 D&D) | 드래그앤드롭, Storage 업로드, 실시간 반영 | 90% | 비디오 업로드 UI 있지만 image/* 만 허용 |
| 4 | 실시간 피드 | Supabase Realtime 구독 | 85% | DELETE/UPDATE 구독 없음 |
| 5 | 주간 미션 | 교사 설정, 학생 완료 감지 | 60% | 미션 CRUD 없음, 완료 자동 감지 없음 |
| 6 | AI 코칭 (Gemini) | Gemini API 마케팅 피드백 | 80% | Vision 분석 프롬프트 정의됐지만 UI 미연결 |
| 7 | 가상 구매 시뮬레이션 | 게시물 시뮬레이션 → 포인트 획득 | 75% | 결과 미저장, 파라미터 하드코딩 |
| 8 | 교사 대시보드 | 팀 현황, 주차 제어, 미션 관리, 게시물 초기화 | 80% | 학생 상세 뷰 없음, 미션 생성 UI 없음 |
| 9 | OnboardingGate | 미인증→/login, 교사→/teacher 라우팅 | 85% | initializedRef 수정 완료, DB 데이터 문제 잔존 |

**전체 Feature Match Rate: 79%**

---

## 2. 설계에 없는 추가 구현 기능

| 기능 | 위치 | 설명 |
|------|------|------|
| Shop/Marketplace | `src/app/shop/page.tsx` | 가상 제품 마켓플레이스 (목데이터) |
| Session/커리큘럼 뷰어 | `src/app/session/page.tsx` | 29주 커리큘럼 뷰어 |
| Learn 페이지 | `src/app/learn/page.tsx` | 마케팅 학습 콘텐츠 모듈 |
| AI 가상 반응 | `src/app/api/ai/reactions/` | AI 고객 페르소나 댓글 생성 |
| 다크/라이트 테마 | `ThemeProvider.tsx` | CSS 변수 기반 테마 시스템 |
| Story Bar | `StoryBar.tsx` | 인스타그램 스타일 스토리 바 |

---

## 3. 보안 이슈 (즉시 수정 필요)

| 심각도 | 파일 | 이슈 | 권장 조치 |
|--------|------|------|----------|
| 🔴 CRITICAL | `src/lib/ai/gemini.ts:3` | `NEXT_PUBLIC_GEMINI_API_KEY` — API 키가 브라우저에 노출됨 (API 라우트에서만 사용하는데 NEXT_PUBLIC_ 접두사 사용) | `GEMINI_API_KEY`로 변경 |
| 🔴 CRITICAL | `OnboardingWizard.tsx:37` | `TEACHER_PIN = "1234"` 클라이언트 번들에 하드코딩 | 환경변수 또는 서버사이드 검증으로 이동 |
| 🔴 CRITICAL | `teacher/page.tsx:35` | 동일한 `TEACHER_PIN = "1234"` 중복 | 위와 동일 |
| 🟡 WARNING | `UploadModal.tsx:137` | `localStorage.getItem("sellstagram_user_id")`로 user_id 설정 (session 대신) | `supabase.auth.getSession()` 일관 사용 |

---

## 4. 코드 버그

| # | 버그 | 위치 | 영향 |
|---|------|------|------|
| 1 | teacher role이면 항상 /teacher로 리디렉션 | `OnboardingGate.tsx:61` | DB 데이터 문제 + 코드 초기화 로직 |
| 2 | 비디오 업로드 UI가 이미지만 허용 | `UploadModal.tsx:237` | 기능 불완전 |
| 3 | 피드 필터(최신/인기)가 동작 안 함 | `page.tsx:44` | feedFilter 상태는 있지만 실제 정렬에 미사용 |
| 4 | 프로필 페이지 팀원 목데이터 | `profile/page.tsx:107` | 실제 팀 데이터 미사용 |
| 5 | 스트릭 카운터 하드코딩 | `page.tsx:214` | 항상 "3 days" 표시 |

---

## 5. 누락된 기능 (설계 O, 구현 X)

| 우선순위 | 기능 | 설명 |
|---------|------|------|
| 🔴 HIGH | 미션 CRUD (교사) | 교사가 미션 생성/편집/삭제 불가. 하드코딩된 목데이터만 토글 가능 |
| 🔴 HIGH | 미션 완료 자동 감지 | 학생이 수익 목표/참여율 달성 시 자동 완료 처리 없음 |
| 🔴 HIGH | 포인트 획득 로직 | 포인트 데이터 구조는 있으나 실제 적립/사용 로직 없음 |
| 🟡 MEDIUM | 이미지 비전 분석 | `vision.ts`와 `VISION_ANALYSIS` 프롬프트 있지만 UI 미연결 |
| 🟡 MEDIUM | 학생 간 댓글 시스템 | AI 가상 반응만 있고 실제 학생-학생 댓글 없음 |
| 🟡 MEDIUM | 프로필 편집 | 편집 버튼 있지만 기능 없음 |
| 🟡 MEDIUM | 실시간 리더보드 | 팀 순위 하드코딩 "2위", 실제 계산 없음 |
| 🟢 LOW | .env.example 파일 | 배포 시 필요한 환경 변수 문서화 없음 |
| 🟢 LOW | PWA 서비스워커 등록 | manifest.json + sw.js 있지만 코드에서 등록 없음 |

---

## 6. 전체 점수

```
┌─────────────────────────────────────────────┐
│  Overall Match Rate: 76 / 100               │
├─────────────────────────────────────────────┤
│  Feature Match Rate:    79%                  │
│  Architecture:          80%                  │
│  Convention:            88%                  │
│  Security:              55%  ← 취약          │
│  Code Quality:          75%                  │
│  Test Coverage:          0%  ← 없음          │
└─────────────────────────────────────────────┘
```

---

## 7. 개선 우선순위

### 즉시 (오늘)
1. `NEXT_PUBLIC_GEMINI_API_KEY` → `GEMINI_API_KEY` 로 변경
2. `TEACHER_PIN` 환경변수 또는 서버사이드로 이동
3. Supabase DB에서 잘못된 `role='teacher'` 프로필 수정

### 단기 (1주)
4. 미션 CRUD 구현 (Supabase 연동)
5. 포인트 적립 로직 구현
6. 피드 필터 정렬 기능 완성
7. `.env.example` 파일 생성

### 장기 (백로그)
8. 실시간 리더보드 계산
9. 이미지 비전 분석 UI 연결
10. 학생 간 댓글 시스템
11. teacher/page.tsx 리팩토링 (600+ 줄)
12. 단위 테스트 추가

---

## 8. Version History

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | 2026-03-02 | Claude Code (gap-detector) | 초기 분석 (76%) |
| 1.1 | 2026-03-02 | Claude Code (pdca-iterator) | Act-1,2 수정: PIN 힌트 제거, 피드 필터 정렬, 포인트 적립, 스트릭 계산, .env.example |
