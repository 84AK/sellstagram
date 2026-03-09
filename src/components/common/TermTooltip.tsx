"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X } from "lucide-react";

interface TermDef {
    term: string;
    emoji: string;
    shortDesc: string;
    detail: string;
    example?: string;
    tip?: string;
}

export const TERM_DICT: Record<string, TermDef> = {
    engagement: {
        term: "인게이지먼트 (Engagement)",
        emoji: "💬",
        shortDesc: "내 게시물에 사람들이 얼마나 반응했는지를 보여주는 비율이에요.",
        detail:
            "인게이지먼트율은 게시물을 본 사람 중에서 좋아요·댓글·공유·저장 등 실제로 행동을 취한 사람의 비율이에요. 숫자가 높을수록 사람들이 내 콘텐츠에 더 많이 반응한 거예요.",
        example: "예시: 100명이 봤는데 10명이 반응했다면 인게이지먼트율 = 10%",
        tip: "💡 질문형 캡션, 명확한 혜택 제시, 공감 가는 스토리가 인게이지먼트를 높여줘요!",
    },
    roas: {
        term: "ROAS (광고 수익률)",
        emoji: "⚡",
        shortDesc: "광고비 1원을 썼을 때 얼마를 벌었는지 보여주는 지표예요.",
        detail:
            "ROAS는 'Return On Ad Spend'의 줄임말로, 광고에 쓴 돈 대비 벌어들인 매출의 비율이에요. ROAS 3x라면 광고비 1만원을 써서 3만원의 매출을 올렸다는 뜻이에요.",
        example: "예시: 광고비 10,000원 → 매출 30,000원 = ROAS 3x",
        tip: "💡 일반적으로 ROAS 2x 이상이면 수익, 1x 미만이면 손실이에요!",
    },
    reach: {
        term: "총 도달 (Reach)",
        emoji: "👥",
        shortDesc: "내 게시물을 본 사람의 총 수예요.",
        detail:
            "도달(Reach)은 내 게시물이 몇 명에게 노출됐는지를 나타내요. 같은 사람이 여러 번 봐도 1명으로 카운트해요. 팔로워 수가 많거나 알고리즘 추천을 받으면 도달 수가 늘어나요.",
        example: "예시: 도달 500명 → 내 게시물을 500명이 한 번 이상 봤어요",
        tip: "💡 해시태그 활용, 게시 시간대, 스토리 연동이 도달을 늘리는 데 효과적이에요!",
    },
    revenue: {
        term: "매출 (Revenue)",
        emoji: "💰",
        shortDesc: "시뮬레이션을 통해 발생한 예상 판매 금액이에요.",
        detail:
            "마케팅 콘텐츠를 통해 구매자가 실제로 지불한 금액의 합계예요. 마케팅 잔고에 반영되어 다음 활동에 활용할 수 있어요.",
        example: "예시: 상품 가격 ₩10,000 × 구매 3건 = 매출 ₩30,000",
        tip: "💡 매출을 높이려면 구매를 유도하는 명확한 CTA(행동 유도 문구)가 필요해요!",
    },
    balance: {
        term: "마케팅 잔고",
        emoji: "💳",
        shortDesc: "마케팅 활동에 사용할 수 있는 내 예산이에요.",
        detail:
            "선생님이 설정한 초기 금액에서 시작해서, 시뮬레이션으로 매출이 발생하면 잔고에 추가돼요. 이 잔고로 더 많은 마케팅 활동을 펼칠 수 있어요.",
        example: "예시: 초기 잔고 ₩1,000,000 + 시뮬 매출 ₩30,000 = 잔고 ₩1,030,000",
        tip: "💡 잔고를 효율적으로 활용해서 좋은 마케팅 전략을 세워보세요!",
    },
    cta: {
        term: "CTA (행동 유도 문구)",
        emoji: "📣",
        shortDesc: "사용자가 특정 행동을 하도록 유도하는 문구예요.",
        detail:
            "CTA는 'Call To Action'의 줄임말로, 게시물을 본 사람에게 '지금 구매하기', '링크 클릭', '댓글 달기' 같이 특정 행동을 하도록 유도하는 문구나 버튼이에요.",
        example: "예시: \"지금 바로 구매하기 👉\", \"댓글로 후기 남겨주세요!\"",
        tip: "💡 CTA는 짧고 명확할수록 효과적이에요. 한 게시물에 하나의 CTA만 사용하세요!",
    },
};

interface TermTooltipProps {
    termKey: keyof typeof TERM_DICT;
    size?: number;
    className?: string;
}

export default function TermTooltip({ termKey, size = 14, className = "" }: TermTooltipProps) {
    const [open, setOpen] = useState(false);
    // fixed 팝오버 위치 계산용
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);
    const def = TERM_DICT[termKey];
    if (!def) return null;

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const popW = 300;
            let left = rect.left + rect.width / 2 - popW / 2;
            // 화면 밖으로 나가지 않게 클램핑
            left = Math.max(8, Math.min(left, window.innerWidth - popW - 8));
            setPopoverPos({ top: rect.bottom + 8, left });
        }
        setOpen(v => !v);
    };

    // 바깥 클릭 / ESC 시 닫기
    useEffect(() => {
        if (!open) return;
        const onMouse = (e: MouseEvent) => {
            if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
                // 팝오버 영역도 확인 (portal이므로 별도 처리)
                const pop = document.getElementById("term-tooltip-pop");
                if (!pop || !pop.contains(e.target as Node)) setOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", onMouse);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onMouse);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <span className={`relative inline-flex items-center ${className}`}>
            <button
                ref={btnRef}
                onClick={handleOpen}
                className="flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                style={{
                    width: size + 6,
                    height: size + 6,
                    color: open ? "var(--secondary)" : "var(--foreground-muted)",
                    opacity: open ? 1 : 0.7,
                }}
                aria-label={`${def.term} 설명 보기`}
            >
                <HelpCircle size={size} />
            </button>

            {open && typeof window !== "undefined" && createPortal(
                <>
                    {/* 배경 딤 (모바일) — 모바일에서만 보임 */}
                    <div
                        className="md:hidden fixed inset-0 z-[9998]"
                        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
                        onClick={() => setOpen(false)}
                    />

                    {/* 모바일: 하단 시트 */}
                    <div
                        className="md:hidden fixed left-0 right-0 bottom-0 z-[9999] px-4 pb-8 pt-2"
                        onClick={() => setOpen(false)}
                    >
                        <div
                            className="w-full max-w-sm mx-auto rounded-3xl p-5 flex flex-col gap-3"
                            style={{ background: "var(--surface)", boxShadow: "0 -4px 32px rgba(0,0,0,0.2)" }}
                            onClick={e => e.stopPropagation()}
                        >
                            <TooltipContent def={def} onClose={() => setOpen(false)} />
                        </div>
                    </div>

                    {/* 데스크탑: fixed 팝오버 */}
                    <div
                        id="term-tooltip-pop"
                        className="hidden md:block fixed z-[9999]"
                        style={{
                            top: popoverPos.top,
                            left: popoverPos.left,
                            width: 300,
                        }}
                    >
                        {/* 말풍선 화살표 */}
                        <div
                            className="absolute -top-[7px] w-3.5 h-3.5 rotate-45"
                            style={{
                                left: Math.min(
                                    Math.max(
                                        (btnRef.current?.getBoundingClientRect().left ?? 0) +
                                        (btnRef.current?.getBoundingClientRect().width ?? 0) / 2 -
                                        popoverPos.left - 7,
                                        12
                                    ),
                                    276
                                ),
                                background: "var(--surface)",
                                borderTop: "1px solid var(--border)",
                                borderLeft: "1px solid var(--border)",
                            }}
                        />
                        <div
                            className="rounded-2xl p-4 flex flex-col gap-2.5"
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
                            }}
                        >
                            <TooltipContent def={def} onClose={() => setOpen(false)} />
                        </div>
                    </div>
                </>,
                document.body
            )}
        </span>
    );
}

function TooltipContent({ def, onClose }: { def: TermDef; onClose: () => void }) {
    return (
        <>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{def.emoji}</span>
                    <span className="text-sm font-black" style={{ color: "var(--foreground)" }}>
                        {def.term}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg shrink-0 transition-colors hover:bg-foreground/5"
                    style={{ color: "var(--foreground-muted)" }}
                >
                    <X size={14} />
                </button>
            </div>

            <p className="text-[13px] font-semibold leading-relaxed" style={{ color: "var(--secondary)" }}>
                {def.shortDesc}
            </p>

            <p className="text-[12px] leading-relaxed" style={{ color: "var(--foreground-soft)" }}>
                {def.detail}
            </p>

            {def.example && (
                <div className="px-3 py-2 rounded-xl text-[11px] leading-relaxed"
                    style={{ background: "var(--surface-2)", color: "var(--foreground-muted)" }}>
                    {def.example}
                </div>
            )}

            {def.tip && (
                <p className="text-[11px] leading-relaxed font-semibold" style={{ color: "var(--accent)" }}>
                    {def.tip}
                </p>
            )}
        </>
    );
}
