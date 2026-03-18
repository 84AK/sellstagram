"use client";

import { useState } from "react";
import { Shield, X, ChevronRight } from "lucide-react";

interface PrivacyModalProps {
  onClose: () => void;
  onToggleDoNotShowToday: (checked: boolean) => void;
  onViewPolicy: () => void;
}

export default function PrivacyModal({
  onClose,
  onToggleDoNotShowToday,
  onViewPolicy,
}: PrivacyModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleConfirm = () => {
    onToggleDoNotShowToday(isChecked);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-black/5 dark:border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-secondary/10 to-transparent border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">개인정보 보호 안내</h2>
              <p className="text-xs text-foreground-muted">교육부 학습지원 소프트웨어 기준 준수</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-foreground-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          {[
            {
              title: "수집 목적",
              desc: "팀별 학습 이력 관리 및 서비스 제공·인증 목적으로만 활용됩니다.",
            },
            {
              title: "수집 항목 (최소화)",
              desc: "아이디, 팀코드만 수집하며 이름·이메일·전화번호는 수집하지 않습니다.",
            },
            {
              title: "만 14세 미만",
              desc: "법정대리인 동의 절차를 거쳐야 하며, 열람·삭제 권리를 보장합니다.",
            },
            {
              title: "권리 행사",
              desc: "언제든지 관리자에게 데이터 삭제 및 정보 열람을 요청할 수 있습니다.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 px-4 py-3"
            >
              <p className="text-xs font-semibold text-secondary mb-0.5">{item.title}</p>
              <p className="text-xs text-foreground-soft leading-relaxed">{item.desc}</p>
            </div>
          ))}

          <button
            onClick={onViewPolicy}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium text-foreground-soft hover:text-secondary hover:bg-secondary/5 transition-colors group"
          >
            <span>상세 개인정보 처리방침 확인</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-4 h-4 rounded accent-secondary cursor-pointer"
            />
            <span className="text-xs text-foreground-muted">오늘 하루 보지 않기</span>
          </label>
          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary-hover active:scale-[0.98] transition-all"
          >
            확인하고 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
