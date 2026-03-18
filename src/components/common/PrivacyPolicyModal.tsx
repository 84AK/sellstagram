"use client";

import { X, Shield } from "lucide-react";
import ReactMarkdown from "react-markdown";

const PRIVACY_POLICY_CONTENT = `# 개인정보 처리방침

본 개인정보 처리방침은 **아크랩스(AKLabs) AI 실습 포털**(이하 "서비스")이 이용자의 개인정보를 어떻게 수집, 이용, 보호하는지 안내합니다. 본 서비스는 교육부의 '학습지원 소프트웨어 필수기준'을 준수합니다.

---

## 1. 개인정보의 수집 및 이용 목적
서비스는 다음의 목적을 위해 최소한의 개인정보를 수집 및 이용합니다.
- **학습 이력 관리**: 팀별/주차별 실습 기록 작성 및 관리, 동료 학습 내용 공유.
- **서비스 제공 및 관리**: 이용자 식별, 로그인 인증, 시스템 보안 유지.

## 2. 수집하는 개인정보의 항목
서비스는 회원가입 및 이용 시 아래의 항목을 수집합니다.
- **필수 항목**: 아이디(ID), 비밀번호
- **자동 수집 항목**: (해당되는 경우) 접속 로그, 쿠키 등 내부 통계 데이터

> 본 서비스는 이용자의 이름, 이메일, 전화번호 등 불필요한 개인정보를 수집하지 않는 **데이터 최소화(Data Minimization)** 원칙을 준수합니다.

## 3. 개인정보의 보유 및 이용 기간
- 수집된 개인정보는 **이용자가 회원 탈퇴를 요청하거나 목적이 달성될 때까지** 보유 및 이용됩니다.
- 단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.

## 4. 만 14세 미만 아동의 개인정보 보호
- 본 서비스는 만 14세 미만 아동이 이용할 수 있으며, 이 경우 **법정대리인(부모 등)의 동의** 또는 절차를 거쳐야 합니다.
- 만 14세 미만 아동의 개인정보 수집 시 법정대리인의 관련 권리(열람, 정정, 삭제 등)를 보장합니다.

## 5. 이용자의 권리 및 행사 방법
이용자는 언제든지 자신의 개인정보에 대해 다음의 권리를 행사할 수 있습니다.
1. **열람 및 정정**: 대시보드 내 정보 확인/수정.
2. **삭제 및 처리정지 요구**: 회원 탈퇴 또는 관리자 문의를 통한 조치.

권리 행사는 관리자에게 서면, 전자우편 등을 통해 요청하실 수 있으며, 서비스는 지체 없이 처리합니다.

## 6. 개인정보의 기술적/관리적 보호 조치
서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
- **비밀번호 암호화**: 이용자의 비밀번호는 암호화되어 안전하게 관리됩니다.
- **접근 권한 관리**: 인가된 관리자 외 불필요한 접근을 제한합니다.

## 7. 개인정보 보호책임자 및 문의처
서비스 이용 중 발생하는 개인정보 보호 관련 모든 문의는 담당 관리자에게 연락해 주시기 바랍니다.

---

*본 방침은 2026년 3월 18일부터 적용됩니다.*`;

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export default function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-black/5 dark:border-white/10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-secondary/10 to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-secondary" />
            </div>
            <h2 className="font-bold text-base text-foreground">개인정보 처리방침</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-foreground-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="prose prose-sm max-w-none text-foreground-soft
            prose-headings:text-foreground prose-headings:font-bold
            prose-h1:text-lg prose-h2:text-sm prose-h2:text-secondary prose-h2:uppercase prose-h2:tracking-wide prose-h2:mt-5 prose-h2:mb-2
            prose-p:text-xs prose-p:leading-relaxed
            prose-li:text-xs prose-li:leading-relaxed
            prose-strong:text-foreground prose-strong:font-semibold
            prose-hr:border-black/5 dark:prose-hr:border-white/10
            prose-blockquote:border-l-secondary prose-blockquote:bg-secondary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-3 prose-blockquote:text-xs prose-blockquote:not-italic">
            <ReactMarkdown>{PRIVACY_POLICY_CONTENT}</ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/5 dark:border-white/5 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary-hover active:scale-[0.98] transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
