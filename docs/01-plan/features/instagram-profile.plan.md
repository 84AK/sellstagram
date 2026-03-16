# Plan: instagram-profile

> 인스타그램 스타일 공개 프로필 + 좋아요/댓글 시스템

**Created**: 2026-03-13
**Phase**: Plan → Design → Do
**Level**: Dynamic

---

## 1. 목표

각 학생이 자신만의 공개 프로필 페이지를 가지며, 다른 학생들이 방문해 콘텐츠를 탐색하고 좋아요/댓글을 달 수 있는 인스타그램 스타일 SNS 경험 구현.

## 2. 기능 범위

### In Scope
- [ ] `profiles` 테이블에 `bio`, `profile_link` 필드 추가
- [ ] `post_likes` 테이블 신설 (좋아요 토글, 중복 방지)
- [ ] `/profile/[handle]` 공개 프로필 페이지
  - 프로필 헤더 (아바타, 이름, handle, bio, link, 통계)
  - 3열 게시물 그리드
  - 게시물 클릭 → 상세 모달 (좋아요 + 댓글)
- [ ] 댓글 UI (comments 테이블은 이미 존재)
- [ ] 좋아요 토글 UI (하트 버튼, 내가 눌렀는지 표시)
- [ ] 기존 `/profile` 편집 모달에 bio/link 입력 추가
- [ ] 피드 카드에서 작성자 클릭 → 공개 프로필로 이동

### Out of Scope
- 팔로우/언팔로우 기능
- DM(다이렉트 메시지)
- 스토리 기능

## 3. 사용자 스토리

| 역할 | 시나리오 | 가치 |
|------|---------|------|
| 학생 | 내 프로필에 bio와 링크를 설정하고 싶다 | 개성 표현 |
| 학생 | 다른 학생 프로필에서 그들의 모든 게시물을 보고 싶다 | 경쟁/벤치마크 |
| 학생 | 마음에 드는 게시물에 좋아요를 누르고 싶다 | 상호작용 |
| 학생 | 게시물에 댓글을 달고 싶다 | 피드백 문화 |

## 4. DB 변경사항

```sql
-- profiles 확장
ALTER TABLE profiles ADD COLUMN bio text;
ALTER TABLE profiles ADD COLUMN profile_link text;

-- 좋아요 테이블 (중복 방지)
CREATE TABLE post_likes (
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  PRIMARY KEY (post_id, user_id)
);
```

## 5. 파일 목록

| 파일 | 유형 | 설명 |
|------|------|------|
| `src/app/profile/[handle]/page.tsx` | 신규 | 공개 프로필 페이지 |
| `src/components/profile/PublicProfileHeader.tsx` | 신규 | 프로필 헤더 컴포넌트 |
| `src/components/profile/PostGrid.tsx` | 신규 | 3열 그리드 |
| `src/components/profile/PostDetailModal.tsx` | 신규 | 포스트 상세 + 댓글 모달 |
| `src/components/feed/FeedCard.tsx` | 수정 | 작성자 클릭 → 프로필 이동 |
| `src/components/profile/EditProfileModal.tsx` | 수정 | bio/link 입력 추가 |
| `src/lib/supabase/schema.sql` | 수정 | post_likes, bio, profile_link |
| `docs/supabase-migration.sql` | 신규 | 마이그레이션 SQL |
