"use client";

import { Shield, ExternalLink } from "lucide-react";

interface FooterProps {
  onOpenPrivacyPolicy: () => void;
}

export default function Footer({ onOpenPrivacyPolicy }: FooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 dark:border-white/5 bg-surface/90 backdrop-blur-sm px-4 py-4">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-2">
        {/* 상단: 개인정보 + 교육부 기준 */}
        <div className="flex items-center gap-1.5">
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

        {/* 하단: 아크랩스 링크 */}
        <a
          href="https://litt.ly/aklabs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-foreground-muted hover:text-primary transition-colors group"
        >
          <span>Powered by AKLabs</span>
          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>
    </footer>
  );
}
