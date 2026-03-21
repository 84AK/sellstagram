"use client";

/**
 * BrandLoader — 앱 전역 공용 로딩 컴포넌트
 *
 * variant="page"    : 전체 화면 점유 (페이지 로딩, 인증 처리 등)
 * variant="section" : 섹션 내부 중앙 정렬 (카드/패널 내부)
 *
 * text prop: 상황별 안내 문구 (없으면 표시 안 함)
 */
interface BrandLoaderProps {
    variant?: "page" | "section";
    text?: string;
}

export default function BrandLoader({ variant = "page", text }: BrandLoaderProps) {
    const isPage = variant === "page";

    return (
        <div
            className={
                isPage
                    ? "fixed inset-0 z-[9998] flex flex-col items-center justify-center gap-5"
                    : "flex flex-col items-center justify-center gap-4 py-16"
            }
            style={isPage ? { background: "var(--background)" } : undefined}
        >
            {/* 튀는 로고 */}
            <div style={{ animation: "bl-bounce 0.7s ease-in-out infinite alternate" }}>
                <div
                    className="flex items-center justify-center rounded-2xl"
                    style={{
                        width: isPage ? 64 : 48,
                        height: isPage ? 64 : 48,
                        background: "linear-gradient(135deg, #FF6B35, #FF9A72)",
                        boxShadow: "0 8px 28px rgba(255,107,53,0.30)",
                    }}
                >
                    {/* 번개 아이콘 */}
                    <svg
                        width={isPage ? 30 : 22}
                        height={isPage ? 30 : 22}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                </div>
            </div>

            {/* 점 세 개 */}
            <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="rounded-full"
                        style={{
                            width: isPage ? 7 : 5,
                            height: isPage ? 7 : 5,
                            background: "#FF6B35",
                            animation: `bl-dot 0.9s ease-in-out ${i * 0.18}s infinite alternate`,
                        }}
                    />
                ))}
            </div>

            {/* 안내 문구 */}
            {text && (
                <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--foreground-muted)" }}
                >
                    {text}
                </p>
            )}

            <style>{`
                @keyframes bl-bounce {
                    from { transform: translateY(0px);   }
                    to   { transform: translateY(-10px); }
                }
                @keyframes bl-dot {
                    from { opacity: 0.2; transform: scale(0.7); }
                    to   { opacity: 1;   transform: scale(1.3); }
                }
            `}</style>
        </div>
    );
}
