"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Upload,
    PlayCircle,
    Sparkles,
    Trophy,
    Target,
    Users,
    Zap,
    BarChart3,
    ShoppingBag,
    MessageCircle,
    Star,
    HelpCircle,
    CheckCircle2,
    BookOpen,
    GraduationCap,
    Wallet,
    Heart,
} from "lucide-react";

/* ── 타입 ── */
interface Step {
    emoji: string;
    title: string;
    desc: string;
}

interface FAQItem {
    q: string;
    a: string;
}

interface Section {
    id: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    title: string;
    subtitle: string;
    steps: Step[];
}

/* ── 섹션 데이터 ── */
const SECTIONS: Section[] = [
    {
        id: "start",
        icon: <Zap size={20} />,
        color: "#FF6B35",
        bg: "#FFF3EE",
        title: "시작하기",
        subtitle: "앱 첫 접속 & 프로필 설정",
        steps: [
            {
                emoji: "📱",
                title: "앱 접속 & 온보딩",
                desc: "셀스타그램에 처음 접속하면 온보딩 화면이 나타나요. 나만의 마케터 유형(크리에이터/분석가/스토리텔러/이노베이터)을 선택하고 이름과 닉네임을 입력하세요.",
            },
            {
                emoji: "🎨",
                title: "아바타 선택",
                desc: "이모지 아바타 중 마음에 드는 것을 골라요. 이 아바타는 스토리 바와 팀 랭킹에서 나를 나타내는 아이콘이 됩니다.",
            },
            {
                emoji: "🏷️",
                title: "팀 코드 입력",
                desc: "선생님이 칠판에 적어준 팀 코드를 입력해 팀에 합류하세요. (예: A팀, B팀) 팀 합류 후 실시간 팀 랭킹에 참여할 수 있어요.",
            },
            {
                emoji: "✅",
                title: "설정 완료",
                desc: "온보딩을 마치면 홈 피드로 이동해요. 프로필은 언제든지 프로필 메뉴에서 수정할 수 있어요.",
            },
        ],
    },
    {
        id: "menu",
        icon: <BookOpen size={20} />,
        color: "#4361EE",
        bg: "#EEF1FF",
        title: "메뉴 구조",
        subtitle: "각 화면에서 무엇을 할 수 있나요?",
        steps: [
            {
                emoji: "🏠",
                title: "홈 피드",
                desc: "반 친구들이 올린 마케팅 게시물을 볼 수 있어요. 좋아요와 댓글로 서로 반응하고 오른쪽 사이드바에서 내 마케팅 잔고·팀 랭킹·AI 코칭 기록을 확인할 수 있어요.",
            },
            {
                emoji: "📚",
                title: "오늘의 수업",
                desc: "현재 회차의 수업 목표와 활동 순서를 확인할 수 있어요. 수업 전에 미리 읽어두면 수업 시간을 더 잘 활용할 수 있어요.",
            },
            {
                emoji: "🏆",
                title: "미션 센터",
                desc: "선생님이 설정한 주간 미션을 확인하고 달성 현황을 볼 수 있어요. 미션 완료 시 포인트 보상을 받아요.",
            },
            {
                emoji: "📖",
                title: "학습 자료",
                desc: "마케팅 핵심 개념 카드, AI 도구 가이드, 단계별 튜토리얼이 있어요. 모르는 개념이 생기면 여기서 찾아보세요.",
            },
            {
                emoji: "🛍️",
                title: "셀러샵",
                desc: "마케팅 실습에 쓸 상품들이 있어요. 내가 마케팅할 상품을 고르고 업로드 시 상품을 선택하면 연동돼요.",
            },
            {
                emoji: "🎮",
                title: "마켓 시뮬레이션",
                desc: "선생님이 마켓을 열면 내 게시물로 실시간 구매 반응 시뮬레이션을 돌릴 수 있어요. 매출이 발생하면 마케팅 잔고에 반영돼요.",
            },
            {
                emoji: "👤",
                title: "프로필",
                desc: "내 게시물 목록, 포인트, 팀, 마케팅 스킬 트리를 볼 수 있어요. 이름·아바타도 여기서 수정해요.",
            },
        ],
    },
    {
        id: "upload",
        icon: <Upload size={20} />,
        color: "#06D6A0",
        bg: "#E6FBF5",
        title: "콘텐츠 업로드",
        subtitle: "내 첫 마케팅 게시물 올리기",
        steps: [
            {
                emoji: "➕",
                title: "업로드 버튼 클릭",
                desc: "홈 피드 오른쪽 위 '+' 버튼 또는 모바일 하단 버튼을 눌러요. 업로드 모달이 열립니다.",
            },
            {
                emoji: "🖼️",
                title: "이미지 선택",
                desc: "내 기기에서 이미지를 선택하거나, AI 콘텐츠 스튜디오로 이미지를 생성할 수 있어요. 정사각형(1:1) 비율 이미지가 가장 잘 보여요.",
            },
            {
                emoji: "✍️",
                title: "캡션 & 해시태그 작성",
                desc: "게시물 설명(캡션)을 작성하고 해시태그를 추가해요. '#친환경 #에코백' 처럼 마케팅 키워드를 넣으면 시뮬레이션 점수에 영향을 줍니다.",
            },
            {
                emoji: "🤖",
                title: "AI 코칭 받기",
                desc: "'AI 코칭 받기' 버튼을 누르면 Gemini AI가 내 게시물을 분석해 마케팅 개선 팁을 알려줘요. 반드시 한번 활용해보세요!",
            },
            {
                emoji: "🚀",
                title: "업로드 완료",
                desc: "업로드 버튼을 누르면 피드에 게시물이 등록되고 +10 XP를 받아요. AI 코칭 후 업로드하면 +20 XP!",
            },
        ],
    },
    {
        id: "simulation",
        icon: <PlayCircle size={20} />,
        color: "#8B5CF6",
        bg: "#F3F0FF",
        title: "마켓 시뮬레이션",
        subtitle: "내 게시물로 실전 판매 체험",
        steps: [
            {
                emoji: "⏰",
                title: "마켓 오픈 확인",
                desc: "선생님이 마켓을 열면 '마켓 시뮬레이션' 메뉴에 알림이 표시돼요. 선생님이 설정한 시간(5~30분) 동안 시뮬레이션이 진행됩니다.",
            },
            {
                emoji: "📋",
                title: "게시물 선택",
                desc: "시뮬레이션 화면에서 내가 올린 게시물 중 하나를 선택해요. 어떤 게시물이 반응이 더 좋을지 생각해보며 선택하세요.",
            },
            {
                emoji: "▶️",
                title: "시뮬레이션 시작",
                desc: "'시뮬레이션 시작' 버튼을 누르면 가상 소비자들이 실시간으로 내 게시물에 반응해요. 좋아요·댓글·공유·구매가 실시간으로 쌓여요.",
            },
            {
                emoji: "📊",
                title: "결과 확인",
                desc: "시뮬레이션이 끝나면 결과 카드가 나타나요. 총 매출, 인게이지먼트율, ROAS 등을 확인하고 어떤 전략이 효과적이었는지 분석해봐요.",
            },
            {
                emoji: "💰",
                title: "잔고 반영",
                desc: "시뮬레이션으로 발생한 매출은 마케팅 잔고에 자동으로 추가돼요. 우측 사이드바의 '마케팅 잔고' 카드에서 확인할 수 있어요.",
            },
        ],
    },
    {
        id: "ai",
        icon: <Sparkles size={20} />,
        color: "#D97706",
        bg: "#FFF8E0",
        title: "AI 코칭 활용",
        subtitle: "Gemini AI로 마케팅 실력 키우기",
        steps: [
            {
                emoji: "🧠",
                title: "AI 코칭이란?",
                desc: "Google Gemini AI가 내 마케팅 게시물을 분석해서 강점과 개선점을 알려주는 기능이에요. 실제 마케터들이 받는 피드백과 유사한 내용을 제공해요.",
            },
            {
                emoji: "📝",
                title: "코칭 받는 방법",
                desc: "업로드 모달에서 이미지와 캡션을 작성한 뒤 'AI 코칭 받기' 버튼을 눌러요. 약 10~20초 후 분석 결과가 나타나요.",
            },
            {
                emoji: "📈",
                title: "코칭 결과 해석",
                desc: "총점(100점 만점), 캡션 분석, 해시태그 전략, 타겟 적합성, 개선 제안이 포함돼 있어요. 점수보다 '왜 이런 피드백이 나왔는지'를 이해하는 게 중요해요.",
            },
            {
                emoji: "🔄",
                title: "반복 개선",
                desc: "AI 피드백을 반영해 캡션을 수정한 뒤 다시 코칭을 받아봐요. 어떤 변화가 점수를 높이는지 실험해보면 마케팅 감각이 생겨요.",
            },
            {
                emoji: "📁",
                title: "코칭 기록 보기",
                desc: "오른쪽 사이드바 'AI 코칭 기록'에서 이전에 받은 분석 리포트를 언제든 다시 볼 수 있어요.",
            },
        ],
    },
    {
        id: "points",
        icon: <Star size={20} />,
        color: "#FFC233",
        bg: "#FFFBEC",
        title: "포인트 & XP",
        subtitle: "활동할수록 쌓이는 보상",
        steps: [
            {
                emoji: "⚡",
                title: "XP란?",
                desc: "XP(경험치)는 앱에서 활동할 때마다 쌓이는 점수예요. XP가 올라갈수록 마케터 등급(인턴 → 주니어 → 시니어 → 전문가)이 높아져요.",
            },
            {
                emoji: "📸",
                title: "게시물 업로드 +10~20 XP",
                desc: "게시물을 업로드하면 +10 XP, AI 코칭 후 업로드하면 +20 XP를 받아요. 꾸준히 업로드할수록 유리해요.",
            },
            {
                emoji: "🎯",
                title: "미션 완료 +보너스 XP",
                desc: "선생님이 설정한 주간 미션을 완료하면 추가 보상 XP를 받아요. 미션 센터에서 현재 미션과 달성 조건을 확인하세요.",
            },
            {
                emoji: "🏆",
                title: "팀 포인트",
                desc: "내 XP는 팀 포인트에도 합산돼요. 팀원 모두가 열심히 활동할수록 팀 랭킹이 올라가서 우리 팀이 1등을 차지할 수 있어요!",
            },
        ],
    },
    {
        id: "team",
        icon: <Users size={20} />,
        color: "#EF4444",
        bg: "#FEF2F2",
        title: "팀 활동 & 랭킹",
        subtitle: "팀원과 함께 1위 도전!",
        steps: [
            {
                emoji: "👥",
                title: "팀 구성",
                desc: "선생님이 배정한 팀(A~F팀)에 소속되어 함께 경쟁해요. 온보딩 시 팀 코드를 입력하면 자동으로 배정됩니다.",
            },
            {
                emoji: "📊",
                title: "실시간 팀 랭킹",
                desc: "홈 피드 오른쪽 사이드바에 실시간으로 팀 순위가 업데이트돼요. 내 팀은 색깔로 강조 표시됩니다.",
            },
            {
                emoji: "💬",
                title: "피드 댓글로 소통",
                desc: "다른 팀 친구들 게시물에 댓글을 달아 피드백을 주고받을 수 있어요. 좋아요도 눌러서 서로 응원해요.",
            },
            {
                emoji: "🌟",
                title: "스토리 바 친구 보기",
                desc: "피드 상단 스토리 바에서 반 친구들의 아바타를 클릭하면 친구가 올린 게시물을 모아볼 수 있어요.",
            },
        ],
    },
];

const FAQ_ITEMS: FAQItem[] = [
    {
        q: "팀 코드를 모르면 어떻게 해요?",
        a: "선생님께 팀 코드를 확인하세요. 수업 시작 시 칠판에 적어주거나 구두로 알려드려요. 프로필 설정에서 나중에도 변경 가능해요.",
    },
    {
        q: "AI 코칭이 영어로 나와요!",
        a: "캡션을 한국어로 작성하면 한국어로 코칭이 나와요. 영어 캡션을 쓰면 영어로 분석 결과가 나올 수 있어요.",
    },
    {
        q: "마켓 시뮬레이션은 언제 할 수 있나요?",
        a: "선생님이 교사 대시보드에서 '마켓 열기' 버튼을 눌러야 시뮬레이션을 시작할 수 있어요. 마켓이 열리면 상단에 알림이 표시됩니다.",
    },
    {
        q: "업로드한 게시물을 수정하거나 삭제할 수 있나요?",
        a: "현재 버전에서는 게시물 수정/삭제 기능이 제공되지 않아요. 신중하게 작성 후 업로드해 주세요.",
    },
    {
        q: "마케팅 잔고는 무엇인가요?",
        a: "마케팅 실습에 사용할 수 있는 가상의 예산이에요. 선생님이 초기 금액을 설정하고, 시뮬레이션으로 매출이 발생하면 잔고가 늘어나요.",
    },
    {
        q: "포인트와 XP의 차이가 뭔가요?",
        a: "동일한 개념이에요. XP(경험치) = 포인트로 표시되며, 내 활동 점수가 팀 순위에도 반영됩니다.",
    },
    {
        q: "스토리 바에서 친구 게시물이 안 보여요.",
        a: "아직 다른 학생들이 가입하지 않은 경우 목록이 비어 있을 수 있어요. 팀원들이 모두 온보딩을 마치면 나타납니다.",
    },
    {
        q: "ROAS, 인게이지먼트가 뭔지 모르겠어요.",
        a: "각 지표 옆에 있는 ? 아이콘을 클릭하면 쉬운 설명이 나와요! 모르는 용어는 학습 자료 메뉴의 개념 카드에서도 확인할 수 있어요.",
    },
];

/* ── 섹션 카드 ── */
function SectionCard({ section }: { section: Section }) {
    const [open, setOpen] = useState(false);
    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
        >
            {/* 헤더 */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all hover:brightness-[0.98]"
                style={{ background: open ? section.bg : "var(--surface)" }}
            >
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: section.color, color: "white" }}
                >
                    {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>{section.title}</p>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{section.subtitle}</p>
                </div>
                <div style={{ color: "var(--foreground-muted)" }}>
                    {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </button>

            {/* 스텝 목록 */}
            {open && (
                <div className="px-5 pb-5 pt-2 flex flex-col gap-3">
                    {section.steps.map((step, i) => (
                        <div key={i} className="flex gap-3 items-start">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
                                style={{ background: section.bg }}
                            >
                                {step.emoji}
                            </div>
                            <div className="flex-1 pt-0.5">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-bold" style={{ color: section.color }}>
                                        STEP {i + 1}
                                    </span>
                                    <span className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                                        {step.title}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── FAQ 아이템 ── */
function FAQCard({ item }: { item: FAQItem }) {
    const [open, setOpen] = useState(false);
    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
        >
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
            >
                <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{item.q}</span>
                <div className="shrink-0" style={{ color: "var(--foreground-muted)" }}>
                    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </button>
            {open && (
                <div className="px-5 pb-4">
                    <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-soft)" }}>{item.a}</p>
                </div>
            )}
        </div>
    );
}

/* ── 메인 페이지 ── */
export default function GuidePage() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

            {/* 상단 헤더 */}
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href="/feed"
                    className="p-2 rounded-xl transition-all hover:opacity-70"
                    style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}
                >
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-xl font-black" style={{ color: "var(--foreground)" }}>
                        셀스타그램 사용 가이드
                    </h1>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                        처음 사용하는 학생들을 위한 완전 정복 가이드
                    </p>
                </div>
            </div>

            {/* 빠른 시작 배너 */}
            <div
                className="relative overflow-hidden rounded-2xl p-5 mb-6"
                style={{ background: "linear-gradient(135deg, #FF6B35 0%, #FFC233 100%)" }}
            >
                <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute -right-2 -bottom-8 w-24 h-24 rounded-full bg-white/10" />
                <div className="relative z-10">
                    <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">빠른 시작 순서</p>
                    <p className="text-base font-black text-white mb-3">
                        앱 접속 → 온보딩 → 팀 코드 입력<br />→ 게시물 업로드 → AI 코칭 → 시뮬레이션!
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {["1. 프로필 설정", "2. 팀 합류", "3. 첫 업로드", "4. 시뮬레이션"].map((t, i) => (
                            <span key={i} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* 핵심 기능 칩 */}
            <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                    { icon: <Upload size={16} />, label: "업로드", color: "#06D6A0" },
                    { icon: <PlayCircle size={16} />, label: "시뮬레이션", color: "#8B5CF6" },
                    { icon: <Sparkles size={16} />, label: "AI 코칭", color: "#D97706" },
                    { icon: <Trophy size={16} />, label: "미션", color: "#FF6B35" },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                        <div style={{ color: item.color }}>{item.icon}</div>
                        <span className="text-[10px] font-bold text-center" style={{ color: "var(--foreground-soft)" }}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* 섹션 아코디언 */}
            <div className="flex flex-col gap-3 mb-8">
                <h2 className="text-xs font-black uppercase tracking-wider px-1" style={{ color: "var(--foreground-muted)" }}>
                    📋 기능별 상세 가이드
                </h2>
                {SECTIONS.map((section) => (
                    <SectionCard key={section.id} section={section} />
                ))}
            </div>

            {/* 마케팅 용어 한눈에 보기 */}
            <div
                className="rounded-2xl p-5 mb-8"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={16} style={{ color: "var(--secondary)" }} />
                    <h2 className="text-sm font-black" style={{ color: "var(--foreground)" }}>마케팅 용어 한눈에 보기</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1" style={{ background: "var(--secondary-light)", color: "var(--secondary)" }}>
                        ? 아이콘으로도 확인 가능
                    </span>
                </div>
                <div className="flex flex-col gap-2.5">
                    {[
                        { term: "인게이지먼트 (Engagement)", emoji: "💬", desc: "게시물을 본 사람 중 좋아요·댓글·공유 등 실제 반응을 보인 비율" },
                        { term: "ROAS", emoji: "⚡", desc: "광고비 대비 매출 비율. ROAS 3x = 1만원 투자로 3만원 매출" },
                        { term: "총 도달 (Reach)", emoji: "👥", desc: "내 게시물을 본 사람의 총 수 (중복 제외)" },
                        { term: "CTA", emoji: "📣", desc: "'지금 구매하기' 같이 특정 행동을 유도하는 문구" },
                        { term: "마케팅 잔고", emoji: "💳", desc: "마케팅 실습에 쓸 수 있는 가상 예산. 시뮬 매출로 증가" },
                        { term: "매출 (Revenue)", emoji: "💰", desc: "시뮬레이션을 통해 발생한 예상 판매 금액" },
                    ].map((item) => (
                        <div key={item.term} className="flex items-start gap-3">
                            <span className="text-lg shrink-0 mt-0.5">{item.emoji}</span>
                            <div>
                                <span className="text-xs font-black" style={{ color: "var(--foreground)" }}>{item.term} </span>
                                <span className="text-xs" style={{ color: "var(--foreground-soft)" }}>— {item.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 자주 묻는 질문 */}
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-2 px-1">
                    <HelpCircle size={16} style={{ color: "var(--accent)" }} />
                    <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>
                        자주 묻는 질문 (FAQ)
                    </h2>
                </div>
                {FAQ_ITEMS.map((item, i) => (
                    <FAQCard key={i} item={item} />
                ))}
            </div>

            {/* 하단 CTA */}
            <div
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{ background: "linear-gradient(135deg, var(--secondary-light), var(--primary-light))", border: "1px solid var(--border)" }}
            >
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} style={{ color: "var(--secondary)" }} />
                    <p className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                        가이드를 모두 읽었나요?
                    </p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                    모든 기능을 사용해볼수록 더 많은 XP를 얻고 마케팅 실력이 올라가요.
                    모르는 게 있으면 선생님께 질문하거나 학습 자료 메뉴를 활용하세요!
                </p>
                <div className="flex gap-2">
                    <Link
                        href="/feed"
                        className="flex-1 py-2.5 rounded-xl text-center text-sm font-bold transition-all hover:opacity-90"
                        style={{ background: "var(--primary)", color: "white" }}
                    >
                        🚀 피드로 가기
                    </Link>
                    <Link
                        href="/learn"
                        className="flex-1 py-2.5 rounded-xl text-center text-sm font-bold transition-all hover:opacity-90"
                        style={{ background: "var(--secondary)", color: "white" }}
                    >
                        📖 학습 자료 보기
                    </Link>
                </div>
            </div>
        </div>
    );
}
