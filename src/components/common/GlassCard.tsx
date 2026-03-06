import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    /** glass: 반투명 글래스 (기본) | solid: 흰 카드 | flat: 배경 서피스 */
    variant?: "glass" | "solid" | "flat";
}

export default function GlassCard({ children, className = "", variant = "glass" }: GlassCardProps) {
    const baseClass =
        variant === "solid"
            ? "edu-card"
            : variant === "flat"
            ? "edu-flat"
            : "glass-morphism rounded-2xl overflow-hidden";

    return (
        <div className={`${baseClass} p-4 ${className}`}>
            {children}
        </div>
    );
}
