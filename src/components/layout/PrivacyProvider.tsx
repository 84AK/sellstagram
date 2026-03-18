"use client";

import { useState, useEffect } from "react";
import PrivacyModal from "@/components/common/PrivacyModal";
import PrivacyPolicyModal from "@/components/common/PrivacyPolicyModal";
import Footer from "@/components/layout/Footer";

export default function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  useEffect(() => {
    const hideUntil = localStorage.getItem("hidePrivacyModalUntil");
    if (!hideUntil || new Date(hideUntil) < new Date()) {
      setIsPrivacyModalOpen(true);
    }
  }, []);

  const handleToggleDoNotShowToday = (checked: boolean) => {
    if (checked) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      localStorage.setItem("hidePrivacyModalUntil", tomorrow.toISOString());
    }
  };

  return (
    <>
      {children}
      <Footer onOpenPrivacyPolicy={() => setIsPolicyModalOpen(true)} />

      {isPrivacyModalOpen && (
        <PrivacyModal
          onClose={() => setIsPrivacyModalOpen(false)}
          onToggleDoNotShowToday={handleToggleDoNotShowToday}
          onViewPolicy={() => {
            setIsPrivacyModalOpen(false);
            setIsPolicyModalOpen(true);
          }}
        />
      )}

      {isPolicyModalOpen && (
        <PrivacyPolicyModal onClose={() => setIsPolicyModalOpen(false)} />
      )}
    </>
  );

}
