"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FlaskConical, ArrowLeft, Share2, Check, User } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { ABTest, ABVote, ReasonTag, REASON_TAGS, calcABResult } from "@/store/useABTestStore";
import ReactMarkdown from "react-markdown";

const VOTER_HANDLE_KEY = "ab_voter_handle";
const VOTED_PREFIX     = "ab_voted_";

// ── DB row → ABTest ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToABTest(row: any): ABTest {
    const now = new Date().toISOString();
    const status = row.status === "active" && row.ends_at < now ? "closed" : row.status;
    return {
        id:            row.id,
        creatorHandle: row.creator_handle,
        creatorName:   row.creator_name,
        creatorAvatar: row.creator_avatar,
        variantA:      row.variant_a,
        variantB:      row.variant_b,
        question:      row.question,
        status,
        endsAt:        row.ends_at,
        createdAt:     row.created_at,
        votes: (row.ab_votes ?? []).map((v: {
            id: string; test_id: string; voter_handle: string;
            choice: "a" | "b"; reason_tag: ReasonTag; created_at: string;
        }) => ({
            id: v.id, testId: v.test_id, voterHandle: v.voter_handle,
            choice: v.choice, reasonTag: v.reason_tag, createdAt: v.created_at,
        })),
    };
}

function timeLeft(endsAt: string): string {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "마감";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) return `${Math.floor(h / 24)}일 남음`;
    if (h > 0) return `${h}시간 ${m}분 남음`;
    return `${m}분 남음`;
}

function ResultBar({ pct, color, label }: { pct: number; color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[11px] font-black w-4" style={{ color }}>{label}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-3,#e5e5e5)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-[11px] font-black w-8 text-right" style={{ color }}>{pct}%</span>
        </div>
    );
}

// ── 닉네임 입력 모달 ──────────────────────────────────────────────────
function NicknameModal({ onConfirm }: { onConfirm: (name: string) => void }) {
    const [value, setValue] = useState("");
    const trimmed = value.trim();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
            <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
                style={{ background: "var(--surface)", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #8B5CF6, #4361EE)" }}>
                        <User size={22} className="text-white" />
                    </div>
                    <h2 className="text-base font-black" style={{ color: "var(--foreground)" }}>
                        닉네임을 입력해주세요
                    </h2>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                        투표 참여를 위해 닉네임이 필요해요.<br />한 번 입력하면 다음엔 자동으로 사용돼요.
                    </p>
                </div>

                <input
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && trimmed.length >= 2 && onConfirm(`guest_${trimmed}`)}
                    placeholder="예: 김마케터, 1팀홍길동"
                    maxLength={20}
                    autoFocus
                    className="w-full rounded-2xl px-4 py-3 text-sm font-bold outline-none text-center"
                    style={{ background: "var(--surface-2)", border: "2px solid var(--border)", color: "var(--foreground)" }}
                />

                <button
                    onClick={() => trimmed.length >= 2 && onConfirm(`guest_${trimmed}`)}
                    disabled={trimmed.length < 2}
                    className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #4361EE)" }}
                >
                    투표 참여하기
                </button>
                <p className="text-[10px] text-center" style={{ color: "var(--foreground-muted)" }}>
                    2자 이상 입력 · 앱 계정 없이 참여 가능
                </p>
            </div>
        </div>
    );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────
export default function ABTestSharePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [test,     setTest]     = useState<ABTest | null>(null);
    const [loading,  setLoading]  = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [copied,   setCopied]   = useState(false);

    // 투표자 핸들 — 앱 로그인 유저 or 게스트 닉네임
    const [voterHandle,      setVoterHandle]      = useState<string | null>(null);
    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [pendingVote,      setPendingVote]      = useState<{ choice: "a"|"b"; reason: ReasonTag } | null>(null);

    // 투표 UI 상태
    const [selectedChoice, setSelectedChoice] = useState<"a"|"b"|null>(null);
    const [selectedReason, setSelectedReason] = useState<ReasonTag|null>(null);
    const [submitting,     setSubmitting]      = useState(false);
    const [submitted,      setSubmitted]       = useState(false);
    const [submitError,    setSubmitError]     = useState("");
    const [showDetail,     setShowDetail]      = useState(false);

    // ── 초기화 ─────────────────────────────────────────────────────────
    useEffect(() => {
        // 저장된 게스트 핸들 복원
        const saved = localStorage.getItem(VOTER_HANDLE_KEY);
        if (saved) setVoterHandle(saved);

        // 이미 투표했는지 확인
        const alreadyVoted = localStorage.getItem(`${VOTED_PREFIX}${id}`);
        if (alreadyVoted) setSubmitted(true);
    }, [id]);

    useEffect(() => {
        if (!id) return;
        supabase
            .from("ab_tests")
            .select("*, ab_votes(*)")
            .eq("id", id)
            .single()
            .then(({ data, error }) => {
                setLoading(false);
                if (error || !data) { setNotFound(true); return; }
                setTest(rowToABTest(data));
            }, () => { setLoading(false); setNotFound(true); });
    }, [id]);

    // ── 닉네임 확정 후 pending 투표 처리 ──────────────────────────────
    const handleNicknameConfirm = useCallback((handle: string) => {
        localStorage.setItem(VOTER_HANDLE_KEY, handle);
        setVoterHandle(handle);
        setShowNicknameModal(false);
        if (pendingVote) {
            submitVote(handle, pendingVote.choice, pendingVote.reason);
            setPendingVote(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingVote]);

    // ── 실제 투표 제출 ─────────────────────────────────────────────────
    async function submitVote(handle: string, choice: "a"|"b", reason: ReasonTag) {
        if (!test || !id) return;
        setSubmitting(true);

        const { error } = await supabase.from("ab_votes").insert({
            test_id:      id,
            voter_handle: handle,
            choice,
            reason_tag:   reason,
        });

        setSubmitting(false);

        if (error) {
            // 중복 투표(unique 위반)는 조용히 처리, 나머지는 사용자에게 알림
            if (error.code === "23505") {
                localStorage.setItem(`${VOTED_PREFIX}${id}`, "1");
                setSubmitted(true);
            } else {
                setSubmitError("투표 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
            }
            return;
        }

        if (!error) {
            // 로컬 상태에 반영
            const newVote: ABVote = {
                id:          crypto.randomUUID(),
                testId:      id,
                voterHandle: handle,
                choice,
                reasonTag:   reason,
                createdAt:   new Date().toISOString(),
            };
            setTest(prev => prev ? { ...prev, votes: [...prev.votes, newVote] } : prev);
            localStorage.setItem(`${VOTED_PREFIX}${id}`, "1");
            setSubmitted(true);
        }
    }

    // ── 투표 버튼 클릭 ────────────────────────────────────────────────
    function handleVoteSubmit() {
        if (!selectedChoice || !selectedReason) return;
        if (!voterHandle) {
            // 닉네임 없으면 모달 띄우고 pending 저장
            setPendingVote({ choice: selectedChoice, reason: selectedReason });
            setShowNicknameModal(true);
            return;
        }
        submitVote(voterHandle, selectedChoice, selectedReason);
    }

    // ── 공유 ──────────────────────────────────────────────────────────
    function handleShare() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    // ── 로딩 / 에러 ───────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: "#8B5CF644", borderTopColor: "#8B5CF6" }} />
        </div>
    );

    if (notFound) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
            style={{ background: "var(--background)" }}>
            <FlaskConical size={40} style={{ color: "var(--foreground-muted)" }} />
            <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>테스트를 찾을 수 없어요</p>
            <p className="text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
                링크가 만료됐거나 삭제된 테스트예요.
            </p>
            <button onClick={() => router.push("/")}
                className="px-5 py-2.5 rounded-2xl font-bold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #4361EE)" }}>
                피드로 돌아가기
            </button>
        </div>
    );

    const result       = test ? calcABResult(test) : null;
    const isClosed     = test?.status === "closed";
    const myVote       = test?.votes.find(v => v.voterHandle === voterHandle);
    const hasVoted     = submitted || !!myVote;
    const showResult   = hasVoted || isClosed;
    const aImg         = test?.variantA.images?.[0] ?? test?.variantA.image;
    const bImg         = test?.variantB.images?.[0] ?? test?.variantB.image;

    return (
        <div className="min-h-screen" style={{ background: "var(--background)" }}>

            {/* 닉네임 모달 */}
            {showNicknameModal && (
                <NicknameModal onConfirm={handleNicknameConfirm} />
            )}

            {/* 헤더 */}
            <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
                style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)" }}>
                <button onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-sm font-bold"
                    style={{ color: "var(--foreground-soft)" }}>
                    <ArrowLeft size={15} /> 돌아가기
                </button>
                <div className="flex items-center gap-1.5">
                    <FlaskConical size={13} style={{ color: "#8B5CF6" }} />
                    <span className="text-sm font-black" style={{ color: "#8B5CF6" }}>A/B 테스트</span>
                </div>
                <button onClick={handleShare}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                    style={{ background: copied ? "#06D6A022" : "var(--surface-2)", color: copied ? "#06D6A0" : "var(--foreground-soft)" }}>
                    {copied ? <><Check size={11} /> 복사됨</> : <><Share2 size={11} /> 공유</>}
                </button>
            </div>

            {/* 본문 */}
            <div className="max-w-md mx-auto px-4 py-5 flex flex-col gap-4">

                {/* 참여 배너 */}
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                    style={{ background: "linear-gradient(135deg, #8B5CF622, #4361EE11)", border: "1px solid #8B5CF633" }}>
                    <FlaskConical size={18} style={{ color: "#8B5CF6" }} />
                    <div>
                        <p className="text-xs font-black" style={{ color: "#8B5CF6" }}>마케팅 A/B 테스트에 참여해요!</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                            {isClosed ? "이미 마감된 테스트예요. 결과를 확인해보세요." : "두 버전 중 더 마음에 드는 쪽에 투표해주세요"}
                        </p>
                    </div>
                </div>

                {/* 투표 카드 */}
                {test && (
                    <div className="rounded-3xl overflow-hidden"
                        style={{ background: "var(--surface)", border: `2px solid ${isClosed ? "var(--border)" : "#8B5CF6"}`, boxShadow: isClosed ? "none" : "0 4px 20px rgba(139,92,246,0.12)" }}>

                        {/* 카드 헤더 */}
                        <div className="flex items-center justify-between px-4 py-3"
                            style={{ background: isClosed ? "var(--surface-2)" : "linear-gradient(135deg, #8B5CF622, #4361EE11)" }}>
                            <div className="flex items-center gap-2">
                                <FlaskConical size={14} style={{ color: isClosed ? "var(--foreground-muted)" : "#8B5CF6" }} />
                                <span className="text-xs font-black" style={{ color: isClosed ? "var(--foreground-muted)" : "#8B5CF6" }}>
                                    {test.question}
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold" style={{ color: "var(--foreground-muted)" }}>
                                {isClosed ? "마감" : timeLeft(test.endsAt)}
                            </span>
                        </div>

                        {/* 출제자 */}
                        <div className="px-4 pt-2 pb-1 text-center">
                            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                by @{test.creatorHandle} · {result?.total ?? 0}명 투표
                            </p>
                        </div>

                        {/* A/B 카드 */}
                        <div className="grid grid-cols-2 gap-3 px-4 pt-2 pb-3">
                            {(["a", "b"] as const).map(v => {
                                const variant  = v === "a" ? test.variantA : test.variantB;
                                const img      = v === "a" ? aImg : bImg;
                                const pct      = v === "a" ? (result?.aPct ?? 0) : (result?.bPct ?? 0);
                                const color    = v === "a" ? "#4361EE" : "#FF6B35";
                                const isWinner = result?.winner === v;
                                const isChosen = selectedChoice === v;
                                const myChoice = myVote?.choice === v;
                                const canSelect = !showResult && !isClosed;

                                return (
                                    <button key={v}
                                        disabled={showResult || isClosed}
                                        onClick={() => canSelect && setSelectedChoice(v)}
                                        className="flex flex-col gap-2 rounded-2xl p-2 transition-all text-left"
                                        style={{
                                            background: isChosen ? `${color}18` : "var(--surface-2)",
                                            border:     `2px solid ${isChosen || myChoice ? color : "transparent"}`,
                                            cursor:     canSelect ? "pointer" : "default",
                                            opacity:    showResult && result?.winner !== "tie" && !isWinner ? 0.65 : 1,
                                        }}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
                                                {v.toUpperCase()}
                                            </span>
                                            {showResult && isWinner && result?.winner !== "tie" && (
                                                <span className="text-[10px]">🏆</span>
                                            )}
                                            {myChoice && <Check size={12} style={{ color }} />}
                                        </div>

                                        {img ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={img} alt={v} className="w-full aspect-square object-cover rounded-xl" />
                                        ) : (
                                            <div className="w-full aspect-square rounded-xl flex items-center justify-center text-2xl"
                                                style={{ background: "var(--surface-3)" }}>🖼️</div>
                                        )}

                                        <div className="text-[10px] leading-relaxed react-markdown line-clamp-3"
                                            style={{ color: "var(--foreground)" }}>
                                            <ReactMarkdown>
                                                {variant.caption.length > 80 ? variant.caption.slice(0, 80) + "…" : variant.caption}
                                            </ReactMarkdown>
                                        </div>

                                        {showResult && (
                                            <div className="mt-1">
                                                <ResultBar pct={pct} color={color} label={v.toUpperCase()} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 이유 선택 */}
                        {!showResult && !isClosed && selectedChoice && (
                            <div className="px-4 pb-4 flex flex-col gap-2">
                                <p className="text-[11px] font-bold" style={{ color: "var(--foreground-muted)" }}>선택 이유 (1가지)</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {REASON_TAGS.map(r => (
                                        <button key={r.id} onClick={() => setSelectedReason(r.id)}
                                            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all"
                                            style={{
                                                background: selectedReason === r.id ? "#8B5CF6" : "var(--surface-2)",
                                                color:      selectedReason === r.id ? "white" : "var(--foreground-muted)",
                                            }}>
                                            {r.emoji} {r.label}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={handleVoteSubmit}
                                    disabled={!selectedReason || submitting}
                                    className="w-full py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-40"
                                    style={{ background: "linear-gradient(135deg, #8B5CF6, #4361EE)", color: "white" }}>
                                    {submitting
                                        ? "저장 중..."
                                        : `${selectedChoice.toUpperCase()} 버전 선택!${!voterHandle ? " (닉네임 필요)" : ""}`
                                    }
                                </button>
                                {submitError && (
                                    <p className="text-[11px] text-center font-bold" style={{ color: "var(--primary)" }}>
                                        ⚠️ {submitError}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 투표 완료 */}
                        {submitted && (
                            <div className="px-4 pb-3 text-center text-[11px] font-bold" style={{ color: "#8B5CF6" }}>
                                ✅ 투표 완료! 결과를 확인해보세요
                            </div>
                        )}

                        {/* AI 분석 */}
                        {showResult && result && result.total > 0 && (
                            <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                                <div className="px-4 py-3" style={{ background: "linear-gradient(135deg, #8B5CF611, #4361EE0A)" }}>
                                    <p className="text-[11px] font-black mb-1" style={{ color: "#8B5CF6" }}>🤖 마케팅 분석</p>
                                    <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{result.aiComment}</p>
                                </div>
                                <button onClick={() => setShowDetail(v => !v)}
                                    className="w-full px-4 py-2 text-[11px] font-bold text-left transition-colors"
                                    style={{ borderTop: "1px solid var(--border)", color: "var(--foreground-muted)", background: "var(--surface-2)" }}>
                                    {showDetail ? "▲ 이유 분포 접기" : "▼ 이유 분포 보기"}
                                </button>
                                {showDetail && (
                                    <div className="px-4 py-3 flex flex-col gap-2" style={{ background: "var(--surface-2)" }}>
                                        {REASON_TAGS.map(r => {
                                            const aC = result.reasons[r.id].a;
                                            const bC = result.reasons[r.id].b;
                                            if (aC + bC === 0) return null;
                                            return (
                                                <div key={r.id} className="flex items-center gap-2 text-[11px]">
                                                    <span className="w-20 shrink-0">{r.emoji} {r.label}</span>
                                                    <span className="px-1.5 py-0.5 rounded font-black text-white text-[9px]" style={{ background: "#4361EE" }}>A {aC}</span>
                                                    <span className="px-1.5 py-0.5 rounded font-black text-white text-[9px]" style={{ background: "#FF6B35" }}>B {bC}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 참여자 현황 */}
                {result && result.total > 0 && (
                    <div className="rounded-2xl px-4 py-3 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <p className="text-xs font-bold" style={{ color: "var(--foreground-muted)" }}>
                            총 <span className="font-black" style={{ color: "var(--foreground)" }}>{result.total}명</span>이 참여했어요
                        </p>
                    </div>
                )}

                {/* 게스트 닉네임 표시 */}
                {voterHandle && voterHandle.startsWith("guest_") && (
                    <div className="flex items-center justify-between rounded-2xl px-4 py-2.5"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <span className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                            참여 닉네임: <strong style={{ color: "var(--foreground)" }}>{voterHandle.replace("guest_", "")}</strong>
                        </span>
                        <button onClick={() => {
                            localStorage.removeItem(VOTER_HANDLE_KEY);
                            setVoterHandle(null);
                        }} className="text-[10px] font-bold" style={{ color: "var(--foreground-muted)" }}>
                            변경
                        </button>
                    </div>
                )}

                {/* 앱 이동 */}
                <button onClick={() => router.push("/")}
                    className="w-full py-3 rounded-2xl font-bold text-sm"
                    style={{ background: "var(--surface-2)", color: "var(--foreground-soft)", border: "1px solid var(--border)" }}>
                    Sellstagram 피드 보러가기 →
                </button>
            </div>
        </div>
    );
}
