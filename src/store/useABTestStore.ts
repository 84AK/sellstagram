import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";

export type ReasonTag =
  | "visual"      // 📸 비주얼
  | "copy"        // 📝 카피/글
  | "benefit"     // 💰 가격/혜택
  | "desire"      // 🎯 구매 욕구
  | "trust";      // 🌟 신뢰감

export const REASON_TAGS: { id: ReasonTag; emoji: string; label: string }[] = [
  { id: "visual",  emoji: "📸", label: "비주얼"    },
  { id: "copy",    emoji: "📝", label: "카피/글"   },
  { id: "benefit", emoji: "💰", label: "가격/혜택" },
  { id: "desire",  emoji: "🎯", label: "구매 욕구" },
  { id: "trust",   emoji: "🌟", label: "신뢰감"   },
];

export type ABTestStatus = "active" | "closed";

export interface ABVariant {
  image: string;
  images?: string[];
  caption: string;
  tags?: string[];
}

export interface ABVote {
  id: string;
  testId: string;
  voterHandle: string;
  choice: "a" | "b";
  reasonTag: ReasonTag;
  createdAt: string;
}

export interface ABTest {
  id: string;
  creatorHandle: string;
  creatorName: string;
  creatorAvatar: string;
  variantA: ABVariant;
  variantB: ABVariant;
  question: string;
  status: ABTestStatus;
  endsAt: string;
  createdAt: string;
  votes: ABVote[];
}

// ── 결과 계산 헬퍼 ────────────────────────────────────────────────────
export function calcABResult(test: ABTest) {
  const total = test.votes.length;
  const aVotes = test.votes.filter(v => v.choice === "a");
  const bVotes = test.votes.filter(v => v.choice === "b");
  const aPct = total ? Math.round((aVotes.length / total) * 100) : 0;
  const bPct = total ? 100 - aPct : 0;

  const reasons: Record<ReasonTag, { a: number; b: number }> = {
    visual:  { a: 0, b: 0 },
    copy:    { a: 0, b: 0 },
    benefit: { a: 0, b: 0 },
    desire:  { a: 0, b: 0 },
    trust:   { a: 0, b: 0 },
  };
  for (const v of test.votes) {
    reasons[v.reasonTag][v.choice]++;
  }

  const winner: "a" | "b" | "tie" =
    aVotes.length > bVotes.length ? "a" :
    bVotes.length > aVotes.length ? "b" : "tie";

  const topReasonAll = (Object.entries(reasons) as [ReasonTag, { a: number; b: number }][])
    .map(([k, v]) => ({ tag: k, total: v.a + v.b }))
    .sort((a, b) => b.total - a.total)[0];

  const TAG_LABEL: Record<ReasonTag, string> = {
    visual: "비주얼 임팩트", copy: "카피의 설득력",
    benefit: "혜택의 명확함", desire: "구매 욕구 자극", trust: "신뢰감 형성",
  };

  let aiComment = "";
  if (total === 0) {
    aiComment = "아직 투표가 없어요. 친구들에게 투표를 부탁해보세요!";
  } else if (winner === "tie") {
    aiComment = "두 버전이 팽팽해요! 가장 많이 선택된 이유를 참고해 두 버전의 장점을 합쳐보세요.";
  } else {
    const winLabel = winner === "a" ? "A 버전" : "B 버전";
    const topTag = topReasonAll?.tag ? TAG_LABEL[topReasonAll.tag] : "전반적인 완성도";
    aiComment = `${winLabel}이 앞서고 있어요. 선택 이유 1위는 '${topTag}'입니다. 이 요소를 더 강화해보세요!`;
  }

  return { total, aVotes: aVotes.length, bVotes: bVotes.length, aPct, bPct, winner, reasons, aiComment };
}

// ── 질문 프리셋 ───────────────────────────────────────────────────────
export const QUESTION_PRESETS = [
  "어떤 게 더 사고 싶어?",
  "어떤 게 더 믿음이 가?",
  "어떤 게 더 눈에 띄어?",
  "어떤 게 더 공유하고 싶어?",
  "어떤 캡션이 더 설득력 있어?",
];

// ── DB row → ABTest 변환 ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToABTest(row: any): ABTest {
  const now = new Date().toISOString();
  const status: ABTestStatus =
    row.status === "active" && row.ends_at < now ? "closed" : row.status;
  return {
    id:            row.id,
    creatorHandle: row.creator_handle,
    creatorName:   row.creator_name,
    creatorAvatar: row.creator_avatar,
    variantA:      row.variant_a as ABVariant,
    variantB:      row.variant_b as ABVariant,
    question:      row.question,
    status,
    endsAt:        row.ends_at,
    createdAt:     row.created_at,
    votes: (row.ab_votes ?? []).map((v: {
      id: string; test_id: string; voter_handle: string;
      choice: "a" | "b"; reason_tag: ReasonTag; created_at: string;
    }) => ({
      id:           v.id,
      testId:       v.test_id,
      voterHandle:  v.voter_handle,
      choice:       v.choice,
      reasonTag:    v.reason_tag,
      createdAt:    v.created_at,
    })),
  };
}

// ── 스토어 ────────────────────────────────────────────────────────────
interface ABTestState {
  tests: ABTest[];
  loading: boolean;
  loadTests: () => Promise<void>;
  addTest: (test: Omit<ABTest, "id" | "votes" | "createdAt">) => Promise<ABTest | null>;
  addVote: (testId: string, vote: Omit<ABVote, "id" | "testId" | "createdAt">) => Promise<void>;
  closeTest: (testId: string) => Promise<void>;
  /** @deprecated localStorage 기반, Supabase 전환 후 loadTests() 사용 */
  loadFromStorage: () => void;
}

export const useABTestStore = create<ABTestState>((set, get) => ({
  tests:   [],
  loading: false,

  loadTests: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("ab_tests")
      .select("*, ab_votes(*)")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error || !data) { set({ loading: false }); return; }

    const tests = data.map(rowToABTest);
    set({ tests, loading: false });

    // 만료된 active 테스트 DB에서 자동 closed 처리
    const now = new Date().toISOString();
    const expiredIds = data
      .filter(t => t.status === "active" && t.ends_at < now)
      .map(t => t.id);
    if (expiredIds.length > 0) {
      await supabase.from("ab_tests").update({ status: "closed" }).in("id", expiredIds);
    }
  },

  addTest: async (testData) => {
    const { data, error } = await supabase
      .from("ab_tests")
      .insert({
        creator_handle: testData.creatorHandle,
        creator_name:   testData.creatorName,
        creator_avatar: testData.creatorAvatar,
        variant_a:      testData.variantA,
        variant_b:      testData.variantB,
        question:       testData.question,
        status:         testData.status,
        ends_at:        testData.endsAt,
      })
      .select()
      .single();

    if (error || !data) return null;

    const test: ABTest = { ...rowToABTest(data), votes: [] };
    set(s => ({ tests: [test, ...s.tests] }));
    return test;
  },

  addVote: async (testId, vote) => {
    // 중복 방지: 로컬 상태 먼저 확인
    const existing = get().tests.find(t => t.id === testId);
    if (existing?.votes.some(v => v.voterHandle === vote.voterHandle)) return;

    const { error } = await supabase.from("ab_votes").insert({
      test_id:      testId,
      voter_handle: vote.voterHandle,
      choice:       vote.choice,
      reason_tag:   vote.reasonTag,
    });

    if (error) return;

    const newVote: ABVote = {
      id:          crypto.randomUUID(),
      testId,
      voterHandle: vote.voterHandle,
      choice:      vote.choice,
      reasonTag:   vote.reasonTag,
      createdAt:   new Date().toISOString(),
    };
    set(s => ({
      tests: s.tests.map(t =>
        t.id === testId ? { ...t, votes: [...t.votes, newVote] } : t
      ),
    }));
  },

  closeTest: async (testId) => {
    await supabase.from("ab_tests").update({ status: "closed" }).eq("id", testId);
    set(s => ({
      tests: s.tests.map(t =>
        t.id === testId ? { ...t, status: "closed" as ABTestStatus } : t
      ),
    }));
  },

  // 하위 호환 — 더 이상 사용 안 함
  loadFromStorage: () => {
    get().loadTests();
  },
}));
