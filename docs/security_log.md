# 🔐 작업 로그: 보안 강화 및 취약점 조치 (2026-03-31)

본 로그는 바이브코딩 보안 규칙을 기반으로 수행된 프로젝트 보안 강화 작업의 상세 내용을 기록합니다.

## 1. 수정 내용 (Implementation Details)

### 📋 Supabase RLS 정책 강화 (Rule 3)
- **대상 파일:** `src/lib/supabase/schema.sql`
- **변경 사항:**
    - `posts`, `profiles`, `purchases` 등 본인 데이터에 대해서만 `UPDATE`, `DELETE`가 가능하도록 정책 수정 (`auth.uid() = user_id`).
    - `game_state`, `missions`, `products`, `app_settings` 등 시스템 설정 테이블은 공공(Public) 수정을 전면 차단하고, API 서비스 롤을 통해서만 수정할 수 있도록 변경.
- **해결된 취약점:** 악의적인 사용자가 다른 학생의 게시물을 삭제하거나 시스템 설정을 조작하는 문제 해결.

### 🔌 전용 시스템 업데이트 API 구축 (Rule 5)
- **대상 파일:** `src/app/api/teacher/system/route.ts`
- **변경 사항:**
    - 교사 대시보드에서 `Direct DB Update`를 수행하던 부분을 대체하기 위한 서버사이드 API 구축.
    - `admin_token` 쿠키를 검증하여 정당한 교사 권한이 있는 경우에만 `service_role` 클라이언트로 DB를 조작하도록 구현.
- **해결된 취약점:** 클라이언트 측에서 RLS를 우방향으로 뚫고 DB를 조작해야 했던 구조적 문제 해결.

### 🚦 API 요청 제한 (Rate Limiting) 적용 (Rule 8)
- **대상 파일:** `src/lib/security/rateLimit.ts`, `src/app/api/ai/*`, `src/app/api/simulate/save-result/*`
- **변경 사항:**
    - IP 기반의 메모리 Rate Limiter 유틸리티 구현.
    - 모든 AI 생성 API(분석, 변환, 초안, 다듬기) 및 시뮬레이션 결과 저장 API에 1분당 최대 10회 요청 제한 적용.
- **해결된 취약점:** AI API 남용에 따른 비용 과다 발생 방지 및 시뮬레이션 점수 부풀리기 어뷰징 차단.

## 2. 발생했던 에러 및 해결 (Issues & Solutions)

### ❌ 타입 에러: NextRequest.ip 부재
- **증상:** `NextRequest` 객체에서 `.ip` 속성에 접근할 시 TypeScript 에러 발생.
- **해결:** `x-forwarded-for` 헤더를 먼저 확인하고, `any` 타입 캐스팅을 통해 환경별 호환성을 확보하도록 로직 수정.

### ❌ RLS 정책 충돌
- **증상:** RLS를 강화하자마자 교사 대시보드의 설정 변경 기능이 작동하지 않음.
- **해결:** 프론트엔드(`teacher/page.tsx`) 코드를 전면 수정하여 직접 DB에 접근하는 대신 새로 만든 `/api/teacher/system` API를 호출하도록 변경함.

## 3. 최종 확인 결과 (Final Verification)
- [x] API 키 소스 코드 노출 없음 (Grep 결과 0건)
- [x] .env 파일 Git 커밋 제외 확인
- [x] 로그인하지 않은 상태에서 타인의 게시물 수정 시도 시 DB 차단 확인
- [x] AI API 단시간 반복 호출 시 429 Error (Too Many Requests) 응답 확인

---
**서기(Scribe):** Antigravity AI
**링크:** [아크랩스](https://litt.ly/aklabs)
