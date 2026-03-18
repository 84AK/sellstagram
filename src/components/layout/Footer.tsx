"use client";

import { Shield } from "lucide-react";

interface FooterProps {
  onOpenPrivacyPolicy: () => void;
}

export default function Footer({ onOpenPrivacyPolicy }: FooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 dark:border-white/5 bg-surface/90 backdrop-blur-sm px-4 py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-1.5">
        <Shield className="w-3 h-3 text-foreground-muted" />
        <button
          onClick={onOpenPrivacyPolicy}
          className="text-xs text-foreground-muted hover:text-secondary transition-colors underline-offset-2 hover:underline"
        >
          개인정보 처리방침
        </button>
        <span className="text-foreground-muted text-xs">·</span>
        <span className="text-xs text-foreground-muted">
          교육부 학습지원 소프트웨어 기준 준수
        </span>
      </div>
    </footer>
  );
}
