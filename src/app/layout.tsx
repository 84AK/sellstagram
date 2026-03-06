import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/common/ThemeToggle";
import Sidebar from "@/components/layout/Sidebar";
import UploadModal from "@/components/feed/UploadModal";
import GuideModal from "@/components/common/GuideModal";
import AIReportModal from "@/components/feed/AIReportModal";

import { ThemeProvider } from "@/components/common/ThemeProvider";
import OnboardingGate from "@/components/onboarding/OnboardingGate";
import MissionCompleteToast from "@/components/common/MissionCompleteToast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "셀스타그램 | Sellstagram",
  description: "학생들을 위한 AI 마케팅 시뮬레이션 SNS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sellstagram",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased selection:bg-primary/30 font-sans`}
      >
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          <OnboardingGate>
            <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
              {/* Sidebar will show on MD+ screens */}
              <Sidebar />

              {/* Main Content Area */}
              <main className="flex-1 flex flex-col md:ml-64 pb-24 md:pb-0">
                <div className="w-full max-w-5xl mx-auto min-h-screen">
                  {children}
                </div>
              </main>
            </div>
            <UploadModal />
            <AIReportModal />
            <GuideModal />
            <MissionCompleteToast />
          </OnboardingGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
