"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {supabase} from "@/lib/supabase/client";
import {
  Zap,
  Sparkles,
  Brain,
  ShoppingBag,
  BookOpen,
  ArrowRight,
  Trophy,
  Shield,
  CheckCircle,
  Rocket,
  Image as ImageIcon,
  Loader2,
  TrendingUp,
  BarChart2,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  image_url: string | null;
  xp_bonus: number;
}

interface TeamRank {
  rank: number;
  name: string;
  emoji: string;
  score: number;
}

const TEAM_META: Record<string, {emoji: string; color: string}> = {
  A팀: {emoji: "🔥", color: "#FF6B35"},
  B팀: {emoji: "⚡", color: "#4361EE"},
  C팀: {emoji: "🌊", color: "#06D6A0"},
  D팀: {emoji: "🌿", color: "#8B5CF6"},
  E팀: {emoji: "🦁", color: "#FFC233"},
  F팀: {emoji: "🚀", color: "#EF4444"},
};

const DEMO_POSTS = [
  {
    id: "eco",
    label: "친환경 상품",
    emoji: "🌿",
    bg: "linear-gradient(135deg, #d4f5e9, #a8e6cf)",
    caption:
      "지구를 위한 선택 🌍 친환경 에코백 여름 신상 출시! 비닐 대신 이 가방 하나면 충분해요",
    tags: ["친환경", "에코백", "여름신상", "제로웨이스트"],
    sim: {impressions: 1240, engagementRate: 8.4, clicks: 104},
    reactions: [
      {
        emoji: "🛍️",
        name: "민지 (18)",
        comment: "이거 어디서 사요?? 너무 이뻐요 😍",
      },
      {
        emoji: "💚",
        name: "재현 (24)",
        comment: "환경 생각한 제품이네요! 바로 구매할게요",
      },
      {
        emoji: "🔍",
        name: "서준 (30)",
        comment: "소재가 뭔지 궁금해요. 내구성은 어때요?",
      },
    ],
    coaching:
      "해시태그 전략이 완벽해요! #제로웨이스트 덕분에 환경 관심층에 정확히 도달했어요. 다음엔 업로드 시간을 저녁 7~9시로 맞춰보세요. 인게이지먼트를 2배까지 높일 수 있어요!",
  },
  {
    id: "fashion",
    label: "패션 아이템",
    emoji: "👟",
    bg: "linear-gradient(135deg, #fde8d8, #ffb299)",
    caption:
      "이번 시즌 무조건 1개는 있어야 함 🔥 한정판 스니커즈 드롭! 선착순 50명 특가",
    tags: ["한정판", "스니커즈", "패션", "드롭"],
    sim: {impressions: 2180, engagementRate: 11.2, clicks: 244},
    reactions: [
      {
        emoji: "🛍️",
        name: "민지 (18)",
        comment: "킹정... 바로 구매해야겠다 🔥🔥",
      },
      {
        emoji: "✨",
        name: "유진 (17)",
        comment: "디자인 너무 예쁜데요?? 색상 더 있나요?",
      },
      {
        emoji: "🔍",
        name: "서준 (30)",
        comment: "50명 한정이면 빨리 사야겠네요!",
      },
    ],
    coaching:
      "긴급성 마케팅 폼 미쳤다! '선착순 50명'이라는 문구가 클릭률을 크게 올렸어요. 다음엔 카운트다운 멘션을 추가해보세요. 전환율이 더 올라갈 거예요!",
  },
  {
    id: "tech",
    label: "테크 기기",
    emoji: "📱",
    bg: "linear-gradient(135deg, #dce8ff, #b3c9ff)",
    caption: "공부할 때 이거 없으면 안 됨 📚 노이즈캔슬링 무선이어폰 솔직 리뷰",
    tags: ["이어폰", "테크", "리뷰", "공부템"],
    sim: {impressions: 890, engagementRate: 6.1, clicks: 54},
    reactions: [
      {
        emoji: "🛍️",
        name: "민지 (18)",
        comment: "공부할 때 진짜 필요한 거!! 얼마예요?",
      },
      {
        emoji: "🔍",
        name: "서준 (30)",
        comment: "배터리 몇 시간인지 알 수 있을까요?",
      },
      {
        emoji: "💚",
        name: "재현 (24)",
        comment: "솔직 리뷰 좋아요. 믿음이 가네요!",
      },
    ],
    coaching:
      "솔직 리뷰 컨셉이 신뢰도를 높였어요! 캡션에 구체적인 스펙(배터리 30시간 등)을 추가하면 검색 유입이 더 늘어날 거예요. 실제 착용샷도 함께 올려보세요!",
  },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Gadget: "#FF6B35",
  Audio: "#4361EE",
  Accessory: "#06D6A0",
  Fashion: "#FFC233",
  Photo: "#8B5CF6",
  General: "#FF9A72",
};

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [teamRanks, setTeamRanks] = useState<TeamRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoIdx, setDemoIdx] = useState(0);
  const [demoTab, setDemoTab] = useState<"stats" | "reactions" | "coaching">(
    "stats",
  );
  const [demoAnalyzing, setDemoAnalyzing] = useState(false);
  const [demoRevealed, setDemoRevealed] = useState(true);

  useEffect(() => {
    const init = async () => {
      const {
        data: {session},
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      const [{data: prods}, {data: profiles}] = await Promise.all([
        supabase
          .from("products")
          .select("id,name,price,cost,category,image_url,xp_bonus")
          .eq("is_active", true)
          .order("sort_order", {ascending: true, nullsFirst: false})
          .order("created_at")
          .limit(4),
        supabase.from("profiles").select("team, points"),
      ]);

      setProducts(prods ?? []);

      if (profiles && profiles.length > 0) {
        const totals: Record<string, number> = {};
        profiles.forEach((p: {team: string; points: number}) => {
          if (!p.team) return;
          totals[p.team] = (totals[p.team] || 0) + (p.points || 0);
        });
        const sorted = Object.entries(totals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, score], idx) => ({
            rank: idx + 1,
            name,
            score,
            emoji: TEAM_META[name]?.emoji ?? "⭐",
          }));
        setTeamRanks(sorted);
      }

      setLoading(false);
    };
    init();
  }, []);

  const handleOAuth = async (provider: "google" | "kakao") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {redirectTo: `${window.location.origin}/auth/callback`},
    });
  };

  return (
    <>
      <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-14px) rotate(3deg); }
                }
                @keyframes float2 {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes pulse-ring {
                    0% { box-shadow: 0 0 0 0 rgba(255,107,53,0.35); }
                    70% { box-shadow: 0 0 0 14px rgba(255,107,53,0); }
                    100% { box-shadow: 0 0 0 0 rgba(255,107,53,0); }
                }
                @keyframes pulse-ring-blue {
                    0% { box-shadow: 0 0 0 0 rgba(67,97,238,0.35); }
                    70% { box-shadow: 0 0 0 14px rgba(67,97,238,0); }
                    100% { box-shadow: 0 0 0 0 rgba(67,97,238,0); }
                }
                .bento-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    grid-template-areas:
                        "hero hero hero stats"
                        "ai curriculum curriculum curriculum"
                        "shop shop team teacher";
                }
                @media (max-width: 1024px) {
                    .bento-grid {
                        grid-template-columns: repeat(2, 1fr);
                        grid-template-areas:
                            "hero hero"
                            "stats ai"
                            "curriculum curriculum"
                            "shop team"
                            "teacher teacher";
                    }
                }
                @media (max-width: 640px) {
                    .bento-grid {
                        grid-template-columns: 1fr;
                        grid-template-areas:
                            "hero" "stats" "ai" "curriculum" "shop" "team" "teacher";
                    }
                }
                .bento-hero      { grid-area: hero; }
                .bento-stats     { grid-area: stats; }
                .bento-ai        { grid-area: ai; }
                .bento-curriculum{ grid-area: curriculum; }
                .bento-shop      { grid-area: shop; }
                .bento-team      { grid-area: team; }
                .bento-teacher   { grid-area: teacher; }
                .glass-card {
                    background: rgba(255,255,255,0.75);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255,255,255,0.6);
                }
                [data-theme="dark"] .glass-card {
                    background: rgba(18,18,28,0.75);
                    border-color: rgba(255,255,255,0.08);
                }
                .gradient-text {
                    background: linear-gradient(135deg, #FF6B35 0%, #FF9A72 40%, #4361EE 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: shimmer 4s linear infinite;
                }
                .card-in { animation: fadeInUp 0.55s ease-out both; }
                .card-in:nth-child(1) { animation-delay: 0.04s; }
                .card-in:nth-child(2) { animation-delay: 0.10s; }
                .card-in:nth-child(3) { animation-delay: 0.16s; }
                .card-in:nth-child(4) { animation-delay: 0.22s; }
                .card-in:nth-child(5) { animation-delay: 0.28s; }
                .card-in:nth-child(6) { animation-delay: 0.34s; }
                .card-in:nth-child(7) { animation-delay: 0.40s; }
            `}</style>

      <div className="min-h-screen" style={{background: "var(--background)"}}>
        {/* ── Nav (비로그인 시만 표시) ── */}
        {!isLoggedIn && (
          <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #FF6B35, #FF9A72)",
                }}
              >
                <Zap size={16} className="text-white" />
              </div>
              <span
                className="font-black text-lg tracking-tight font-outfit"
                style={{color: "var(--foreground)"}}
              >
                Sellstagram
              </span>
            </div>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
              style={{
                background: "var(--surface-2)",
                color: "var(--foreground)",
              }}
            >
              로그인
            </Link>
          </nav>
        )}

        {/* ── Bento Grid ── */}
        <div className="bento-grid px-4 md:px-6 max-w-7xl mx-auto mt-4">
          {/* HERO */}
          <div
            className="bento-hero card-in glass-card rounded-3xl p-8 md:p-10 relative overflow-hidden"
            style={{minHeight: 300}}
          >
            <div
              className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,107,53,0.18), transparent 70%)",
                animation: "float 7s ease-in-out infinite",
              }}
            />
            <div
              className="absolute bottom-6 right-20 w-28 h-28 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(67,97,238,0.14), transparent 70%)",
                animation: "float2 9s ease-in-out infinite",
              }}
            />

            <div className="relative z-10 flex flex-col h-full gap-5">
              <span
                className="inline-flex items-center gap-1.5 self-start text-xs font-bold px-3 py-1.5 rounded-full text-white"
                style={{background: "#FF6B35"}}
              >
                <Sparkles size={12} /> 고등학교 마케팅 실습 플랫폼
              </span>

              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.1] font-outfit">
                <span className="gradient-text">마케팅을</span>
                <br />
                <span style={{color: "var(--foreground)"}}>직접 해보는</span>
                <br />
                <span style={{color: "var(--foreground-soft)"}}>
                  유일한 수업
                </span>
              </h1>

              <p
                className="text-base leading-relaxed max-w-sm"
                style={{color: "var(--foreground-muted)"}}
              >
                AI와 함께 SNS 마케팅 전략을 세우고,
                <br /> 팀과 경쟁하며 실전 마케팅 감각을 키워보세요.
              </p>

              <div className="flex flex-wrap gap-3 mt-auto">
                {isLoggedIn ? (
                  <Link
                    href="/feed"
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg, #FF6B35, #FF9A72)",
                    }}
                  >
                    피드 보기 <ArrowRight size={15} />
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => handleOAuth("google")}
                      className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.97]"
                      style={{
                        background: "white",
                        color: "#3C4043",
                        border: "1.5px solid #E5E7EB",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.09)",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google로 시작
                    </button>
                    <button
                      onClick={() => handleOAuth("kakao")}
                      className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.97]"
                      style={{background: "#FEE500", color: "#3C1E1E"}}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="#3C1E1E"
                      >
                        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.82 1.69 5.3 4.27 6.79L5.2 21l4.07-2.14c.88.2 1.79.3 2.73.3 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
                      </svg>
                      카카오로 시작
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="bento-stats card-in glass-card rounded-3xl p-6 flex flex-col justify-between gap-4">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{color: "var(--foreground-muted)"}}
            >
              플랫폼 구성
            </p>
            {[
              {
                value: "29회",
                label: "커리큘럼 수업",
                icon: BookOpen,
                color: "#FF6B35",
              },
              {
                value: "AI",
                label: "실시간 피드백",
                icon: Brain,
                color: "#4361EE",
              },
              {
                value: "6팀",
                label: "팀 경쟁 시스템",
                icon: Trophy,
                color: "#FFC233",
              },
              {
                value: "∞",
                label: "마케팅 시나리오",
                icon: Sparkles,
                color: "#06D6A0",
              },
            ].map(({value, label, icon: Icon, color}) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{background: `${color}18`}}
                >
                  <Icon size={18} style={{color}} />
                </div>
                <div>
                  <p
                    className="text-2xl font-black leading-none"
                    style={{color: "var(--foreground)"}}
                  >
                    {value}
                  </p>
                  <p
                    className="text-xs mt-0.5 font-medium"
                    style={{color: "var(--foreground-muted)"}}
                  >
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* AI COACH */}
          <div className="bento-ai card-in glass-card rounded-3xl p-6 flex flex-col gap-5 relative overflow-hidden">
            <div
              className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(67,97,238,0.15), transparent 70%)",
              }}
            />
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{background: "linear-gradient(135deg, #4361EE, #6B8EFF)"}}
            >
              <Brain size={26} className="text-white" />
            </div>
            <div>
              <p
                className="text-sm font-bold mb-1.5"
                style={{color: "#4361EE"}}
              >
                Gemini AI 코칭
              </p>
              <p
                className="text-lg font-black leading-snug"
                style={{color: "var(--foreground)"}}
              >
                게시물 업로드 즉시
                <br />
                전략 분석
              </p>
            </div>
            <div className="flex flex-col gap-2.5 mt-auto">
              {["콘텐츠 품질 점수", "타겟 적합도 분석", "개선 전략 제안"].map(
                (t) => (
                  <div
                    key={t}
                    className="flex items-center gap-2 text-sm"
                    style={{color: "var(--foreground-soft)"}}
                  >
                    <CheckCircle size={14} style={{color: "#06D6A0"}} />
                    {t}
                  </div>
                ),
              )}
            </div>
          </div>

          {/* CURRICULUM */}
          <div className="bento-curriculum card-in glass-card rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs font-bold mb-1"
                  style={{color: "var(--foreground-muted)"}}
                >
                  체계적인 커리큘럼
                </p>
                <p
                  className="text-xl font-black"
                  style={{color: "var(--foreground)"}}
                >
                  29회 마케팅 여정
                </p>
              </div>
              <BookOpen size={22} style={{color: "#FF6B35"}} />
            </div>
            <div className="flex gap-4">
              {[
                {label: "1학기", count: 15, color: "#FF6B35"},
                {label: "2학기", count: 14, color: "#4361EE"},
              ].map((s) => (
                <div key={s.label} className="flex-1">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span style={{color: s.color}}>{s.label}</span>
                    <span style={{color: "var(--foreground-muted)"}}>
                      {s.count}회
                    </span>
                  </div>
                  <div
                    className="h-2.5 rounded-full"
                    style={{background: "var(--surface-2)"}}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(s.count / 29) * 100}%`,
                        background: s.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "SNS마케팅",
                "브랜딩",
                "콘텐츠기획",
                "데이터분석",
                "광고전략",
                "인플루언서",
                "트렌드분석",
              ].map((kw) => (
                <span
                  key={kw}
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--foreground-soft)",
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-auto">
              {[
                {week: 1, title: "SNS 마케팅 입문"},
                {week: 8, title: "브랜드 아이덴티티"},
                {week: 29, title: "캠페인 발표"},
              ].map((s) => (
                <div
                  key={s.week}
                  className="p-3 rounded-xl"
                  style={{background: "var(--surface-2)"}}
                >
                  <p
                    className="text-[10px] font-bold mb-1"
                    style={{color: "var(--foreground-muted)"}}
                  >
                    {s.week}회차
                  </p>
                  <p
                    className="text-xs font-bold leading-snug"
                    style={{color: "var(--foreground)"}}
                  >
                    {s.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SHOP — 실제 데이터 */}
          <div className="bento-shop card-in glass-card rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs font-bold mb-1"
                  style={{color: "var(--foreground-muted)"}}
                >
                  실전 마케팅 아이템
                </p>
                <p
                  className="text-xl font-black"
                  style={{color: "var(--foreground)"}}
                >
                  셀러 상점
                </p>
              </div>
              <ShoppingBag size={22} style={{color: "#06D6A0"}} />
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2
                  size={24}
                  className="animate-spin"
                  style={{color: "#06D6A0"}}
                />
              </div>
            ) : products.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6">
                <ShoppingBag
                  size={32}
                  style={{color: "var(--foreground-muted)"}}
                />
                <p
                  className="text-sm font-semibold"
                  style={{color: "var(--foreground-muted)"}}
                >
                  선생님이 상품을 등록하면
                  <br />
                  여기에 표시됩니다
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((p) => {
                  const color = CATEGORY_COLORS[p.category] ?? "#FF6B35";
                  const margin =
                    p.cost > 0
                      ? Math.round(((p.price - p.cost) / p.cost) * 100)
                      : 0;
                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl flex flex-col gap-2"
                      style={{background: "var(--surface-2)"}}
                    >
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-16 object-cover rounded-xl"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{background: `${color}18`}}
                        >
                          <ShoppingBag size={15} style={{color}} />
                        </div>
                      )}
                      <p
                        className="text-xs font-bold leading-snug"
                        style={{color: "var(--foreground)"}}
                      >
                        {p.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold" style={{color}}>
                          ₩{p.price.toLocaleString()}
                        </p>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "rgba(6,214,160,0.12)",
                            color: "#06D6A0",
                          }}
                        >
                          +{margin}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p
              className="text-xs font-medium"
              style={{color: "var(--foreground-muted)"}}
            >
              상품을 선택하고 SNS 마케팅 캠페인을 직접 기획해보세요
            </p>
          </div>

          {/* TEAM — 실제 데이터 */}
          <div className="bento-team card-in glass-card rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p
                className="text-lg font-black"
                style={{color: "var(--foreground)"}}
              >
                팀 경쟁
              </p>
              <Trophy size={20} style={{color: "#FFC233"}} />
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2
                  size={20}
                  className="animate-spin"
                  style={{color: "#FFC233"}}
                />
              </div>
            ) : teamRanks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
                <Trophy size={28} style={{color: "var(--foreground-muted)"}} />
                <p
                  className="text-sm font-semibold text-center"
                  style={{color: "var(--foreground-muted)"}}
                >
                  수업이 시작되면
                  <br />팀 순위가 표시됩니다
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {teamRanks.map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{
                      background:
                        t.rank === 1 ? "rgba(255,194,51,0.1)" : "transparent",
                    }}
                  >
                    <span
                      className="text-sm font-black w-4 shrink-0"
                      style={{
                        color:
                          t.rank === 1 ? "#FFC233" : "var(--foreground-muted)",
                      }}
                    >
                      {t.rank}
                    </span>
                    <span className="text-base">{t.emoji}</span>
                    <span
                      className="text-sm font-bold flex-1"
                      style={{color: "var(--foreground)"}}
                    >
                      {t.name}
                    </span>
                    <span
                      className="text-sm font-black tabular-nums"
                      style={{color: "var(--foreground-soft)"}}
                    >
                      {t.score.toLocaleString()}p
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p
              className="text-xs font-medium mt-auto"
              style={{color: "var(--foreground-muted)"}}
            >
              팀원들과 함께 최고의 마케터가 되어보세요
            </p>
          </div>

          {/* TEACHER */}
          <div
            className="bento-teacher card-in glass-card rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden"
            style={{borderColor: "rgba(67,97,238,0.2)"}}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(67,97,238,0.06), transparent)",
              }}
            />
            <div className="relative z-10 flex flex-col gap-4 h-full">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center self-start"
                style={{
                  background: "linear-gradient(135deg, #4361EE, #6B8EFF)",
                  animation: "pulse-ring-blue 2.5s infinite",
                }}
              >
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <p
                  className="text-sm font-bold mb-1"
                  style={{color: "#4361EE"}}
                >
                  선생님 전용
                </p>
                <p
                  className="text-base font-black leading-snug"
                  style={{color: "var(--foreground)"}}
                >
                  수업 관리
                  <br />
                  대시보드
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  "미션 생성 & 관리",
                  "상품 등록 & 수정",
                  "학생 실시간 모니터링",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-xs font-medium"
                    style={{color: "var(--foreground-soft)"}}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{background: "#4361EE"}}
                    />
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href="/teacher"
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold text-white mt-auto transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #4361EE, #6B8EFF)",
                }}
              >
                교사 대시보드 <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── 이렇게 사용해요 ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-16">
          <div className="text-center mb-10">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{color: "#FF6B35"}}
            >
              How it works
            </p>
            <h2
              className="text-2xl md:text-3xl font-black tracking-tight"
              style={{color: "var(--foreground)"}}
            >
              이렇게 사용해요
            </h2>
            <p
              className="text-sm mt-2"
              style={{color: "var(--foreground-muted)"}}
            >
              로그인부터 AI 피드백까지, 5단계로 시작하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              {
                step: "01",
                icon: "🔐",
                title: "로그인",
                desc: "Google 또는 카카오 계정으로 간편하게 시작해요",
                color: "#FF6B35",
                details: ["소셜 계정 1회 클릭", "별도 가입 불필요"],
              },
              {
                step: "02",
                icon: "🎨",
                title: "프로필 설정",
                desc: "마케터 유형을 선택하고 팀 배정을 받아요",
                color: "#FF9A72",
                details: ["크리에이터 · 분석가 등 4가지", "선생님이 팀 배정"],
              },
              {
                step: "03",
                icon: "📦",
                title: "상품 선택",
                desc: "셀러샵에서 마케팅할 상품을 구매해요",
                color: "#FFC233",
                details: ["가상 머니로 구매", "원가·마진율 확인"],
              },
              {
                step: "04",
                icon: "📸",
                title: "콘텐츠 업로드",
                desc: "SNS 피드에 마케팅 콘텐츠를 게시해요",
                color: "#06D6A0",
                details: ["이미지·영상 업로드", "해시태그·캡션 작성"],
              },
              {
                step: "05",
                icon: "🤖",
                title: "AI 피드백",
                desc: "Gemini AI 분석을 받고 XP로 팀과 경쟁해요",
                color: "#4361EE",
                details: ["즉시 전략 코칭", "XP 획득 & 리더보드"],
              },
            ].map((s, i) => (
              <div
                key={s.step}
                className="relative flex flex-col gap-3 p-5 rounded-2xl"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  animation: `fadeInUp 0.55s ease-out ${0.1 + i * 0.09}s both`,
                }}
              >
                <div className="relative self-start">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                    style={{background: `${s.color}14`}}
                  >
                    {s.icon}
                  </div>
                  <span
                    className="absolute -top-1.5 -right-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
                    style={{background: s.color}}
                  >
                    {s.step}
                  </span>
                </div>
                <div>
                  <p
                    className="text-base font-black mb-1"
                    style={{color: "var(--foreground)"}}
                  >
                    {s.title}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{color: "var(--foreground-muted)"}}
                  >
                    {s.desc}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 mt-auto">
                  {s.details.map((d) => (
                    <div
                      key={d}
                      className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{color: s.color}}
                    >
                      <div
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{background: s.color}}
                      />
                      {d}
                    </div>
                  ))}
                </div>
                {i < 4 && (
                  <div
                    className="hidden md:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full items-center justify-center"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <ArrowRight
                      size={10}
                      style={{color: "var(--foreground-muted)"}}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── AI 분석 데모 섹션 ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-16">
          <div className="text-center mb-10">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{color: "#4361EE"}}
            >
              Live Demo
            </p>
            <h2
              className="text-2xl md:text-3xl font-black tracking-tight"
              style={{color: "var(--foreground)"}}
            >
              AI가 이렇게 분석해줘요
            </h2>
            <p
              className="text-sm mt-2"
              style={{color: "var(--foreground-muted)"}}
            >
              게시물을 올리면 즉시 시뮬레이션 결과와 고객 반응을 확인할 수
              있어요
            </p>
          </div>

          {/* 예시 선택 */}
          <div className="flex justify-center gap-2 mb-6">
            {DEMO_POSTS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => {
                  setDemoIdx(i);
                  setDemoTab("stats");
                  setDemoRevealed(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background:
                    demoIdx === i ? "var(--foreground)" : "var(--surface-2)",
                  color:
                    demoIdx === i
                      ? "var(--background)"
                      : "var(--foreground-soft)",
                }}
              >
                <span>{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>

          {(() => {
            const post = DEMO_POSTS[demoIdx];
            const sim = post.sim;
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* 왼쪽: 가상 게시물 */}
                <div className="glass-card rounded-3xl overflow-hidden">
                  <div
                    className="aspect-[4/3] w-full flex items-center justify-center text-7xl"
                    style={{background: post.bg}}
                  >
                    {post.emoji}
                  </div>
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, #4361EE, #06D6A0)",
                        }}
                      >
                        S
                      </div>
                      <div>
                        <p
                          className="text-xs font-black"
                          style={{color: "var(--foreground)"}}
                        >
                          student_marketer
                        </p>
                        <p
                          className="text-[10px]"
                          style={{color: "var(--foreground-muted)"}}
                        >
                          방금 전
                        </p>
                      </div>
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{color: "var(--foreground)"}}
                    >
                      {post.caption}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] font-semibold"
                          style={{color: "#4361EE"}}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 분석 결과 */}
                <div className="flex flex-col gap-4">
                  {/* 완료 헤더 */}
                  <div className="flex items-center justify-between glass-card rounded-2xl p-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{background: "rgba(6,214,160,0.15)"}}
                      >
                        <CheckCircle size={16} style={{color: "#06D6A0"}} />
                      </div>
                      <div>
                        <p
                          className="text-sm font-black"
                          style={{color: "var(--foreground)"}}
                        >
                          분석 완료!
                        </p>
                        <p
                          className="text-[10px]"
                          style={{color: "var(--foreground-muted)"}}
                        >
                          +10 XP 획득
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDemoAnalyzing(true);
                        setDemoRevealed(false);
                        setTimeout(() => {
                          setDemoAnalyzing(false);
                          setDemoRevealed(true);
                          setDemoTab("stats");
                        }, 1200);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:scale-[1.02]"
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--foreground-soft)",
                      }}
                    >
                      <RefreshCw
                        size={11}
                        className={demoAnalyzing ? "animate-spin" : ""}
                      />
                      분석 재현
                    </button>
                  </div>

                  {/* 탭 */}
                  <div
                    className="flex gap-1 p-1 rounded-2xl"
                    style={{background: "var(--surface-2)"}}
                  >
                    {(
                      [
                        {key: "stats", icon: BarChart2, label: "시뮬레이션"},
                        {
                          key: "reactions",
                          icon: MessageCircle,
                          label: "고객 반응",
                        },
                        {key: "coaching", icon: Sparkles, label: "AI 코칭"},
                      ] as const
                    ).map(({key, icon: Icon, label}) => (
                      <button
                        key={key}
                        onClick={() => setDemoTab(key)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all"
                        style={{
                          background:
                            demoTab === key
                              ? "var(--background)"
                              : "transparent",
                          color:
                            demoTab === key
                              ? "var(--foreground)"
                              : "var(--foreground-muted)",
                          boxShadow:
                            demoTab === key
                              ? "0 1px 4px rgba(0,0,0,0.08)"
                              : "none",
                        }}
                      >
                        <Icon size={12} /> {label}
                      </button>
                    ))}
                  </div>

                  {/* 탭 콘텐츠 */}
                  {demoAnalyzing ? (
                    <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-3">
                      <Loader2
                        size={24}
                        className="animate-spin"
                        style={{color: "#4361EE"}}
                      />
                      <p
                        className="text-sm font-bold"
                        style={{color: "var(--foreground-muted)"}}
                      >
                        AI 분석 중...
                      </p>
                    </div>
                  ) : demoRevealed && demoTab === "stats" ? (
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          icon: TrendingUp,
                          label: "예상 노출",
                          value: sim.impressions.toLocaleString(),
                          unit: "명",
                          color: "#FF6B35",
                        },
                        {
                          icon: BarChart2,
                          label: "인게이지먼트",
                          value: sim.engagementRate.toFixed(1),
                          unit: "%",
                          color: "#4361EE",
                        },
                        {
                          icon: Zap,
                          label: "예상 클릭",
                          value: sim.clicks.toLocaleString(),
                          unit: "회",
                          color: "#06D6A0",
                        },
                      ].map(({icon: Icon, label, value, unit, color}) => (
                        <div
                          key={label}
                          className="glass-card rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center"
                        >
                          <Icon size={16} style={{color}} />
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider"
                            style={{color: "var(--foreground-muted)"}}
                          >
                            {label}
                          </span>
                          <span className="text-xl font-black" style={{color}}>
                            {value}
                            <span className="text-sm">{unit}</span>
                          </span>
                        </div>
                      ))}
                      <div
                        className="col-span-3 glass-card rounded-2xl p-4 flex items-start gap-2.5"
                        style={{
                          background: "rgba(255,107,53,0.05)",
                          border: "1px solid rgba(255,107,53,0.15)",
                        }}
                      >
                        <Sparkles
                          size={14}
                          style={{color: "#FF6B35"}}
                          className="mt-0.5 shrink-0"
                        />
                        <p
                          className="text-xs leading-relaxed"
                          style={{color: "var(--foreground-soft)"}}
                        >
                          {sim.engagementRate >= 8
                            ? "인게이지먼트가 높아요! 이미지 퀄리티와 해시태그 전략이 잘 맞았어요."
                            : sim.engagementRate >= 5
                              ? "괜찮은 출발이에요. 캡션에 혜택을 더 구체적으로 담아보세요."
                              : "캡션을 더 감성적으로 다듬으면 반응이 올라갈 거예요."}
                        </p>
                      </div>
                    </div>
                  ) : demoRevealed && demoTab === "reactions" ? (
                    <div className="flex flex-col gap-3">
                      {post.reactions.map((r, i) => (
                        <div
                          key={i}
                          className="glass-card rounded-2xl flex items-start gap-3 p-4"
                        >
                          <span className="text-xl">{r.emoji}</span>
                          <div>
                            <p
                              className="text-[10px] font-black mb-0.5"
                              style={{color: "var(--foreground-muted)"}}
                            >
                              {r.name}
                            </p>
                            <p
                              className="text-sm"
                              style={{color: "var(--foreground)"}}
                            >
                              {r.comment}
                            </p>
                          </div>
                        </div>
                      ))}
                      <p
                        className="text-[10px] text-center font-medium"
                        style={{color: "var(--foreground-muted)"}}
                      >
                        * AI 페르소나가 게시물 내용을 분석해 생성한 가상
                        반응입니다
                      </p>
                    </div>
                  ) : demoRevealed && demoTab === "coaching" ? (
                    <div
                      className="glass-card rounded-2xl p-5 flex flex-col gap-3"
                      style={{
                        background: "rgba(67,97,238,0.04)",
                        border: "1px solid rgba(67,97,238,0.15)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{
                            background:
                              "linear-gradient(135deg, #4361EE, #6B8EFF)",
                          }}
                        >
                          <Brain size={14} className="text-white" />
                        </div>
                        <div>
                          <p
                            className="text-[10px] font-black uppercase tracking-widest"
                            style={{color: "#4361EE"}}
                          >
                            Gemini AI 코치
                          </p>
                          <p
                            className="text-[10px]"
                            style={{color: "var(--foreground-muted)"}}
                          >
                            게시물 분석 완료
                          </p>
                        </div>
                      </div>
                      <p
                        className="text-sm leading-relaxed"
                        style={{color: "var(--foreground)"}}
                      >
                        {post.coaching}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Bottom CTA (비로그인만) ── */}
        {!isLoggedIn && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 mt-10 pb-16">
            <div
              className="glass-card rounded-3xl p-8 md:p-12 text-center flex flex-col items-center gap-5 relative overflow-hidden"
              style={{border: "1px solid var(--border)"}}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.07), transparent 60%)",
                }}
              />
              <div className="relative z-10 flex flex-col items-center gap-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #FF6B35, #FF9A72)",
                    animation: "pulse-ring 2.5s infinite",
                  }}
                >
                  <Rocket size={28} className="text-white" />
                </div>
                <div>
                  <h3
                    className="text-2xl font-black"
                    style={{color: "var(--foreground)"}}
                  >
                    지금 바로 시작하세요
                  </h3>
                  <p
                    className="text-sm mt-2"
                    style={{color: "var(--foreground-muted)"}}
                  >
                    선생님이 수업을 열면 팀과 함께 마케팅 여정이 시작됩니다
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => handleOAuth("google")}
                    className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
                    style={{
                      background: "white",
                      color: "#3C4043",
                      border: "1.5px solid #E5E7EB",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.09)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google로 시작하기
                  </button>
                  <button
                    onClick={() => handleOAuth("kakao")}
                    className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
                    style={{background: "#FEE500", color: "#3C1E1E"}}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="#3C1E1E"
                    >
                      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.82 1.69 5.3 4.27 6.79L5.2 21l4.07-2.14c.88.2 1.79.3 2.73.3 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
                    </svg>
                    카카오로 시작하기
                  </button>
                </div>
              </div>
            </div>
            <p
              className="text-center text-xs mt-6"
              style={{color: "var(--foreground-muted)"}}
            >
              © 2025 Sellstagram · 마케팅 시뮬레이션 플랫폼
            </p>
          </div>
        )}

        {isLoggedIn && <div className="pb-16" />}
      </div>
    </>
  );
}
