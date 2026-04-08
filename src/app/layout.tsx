import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/common/ThemeToggle";
import Sidebar from "@/components/layout/Sidebar";
import ClientLayout from "@/components/layout/ClientLayout";
import UploadModal from "@/components/feed/UploadModal";
import GuideModal from "@/components/common/GuideModal";
import AIReportModal from "@/components/feed/AIReportModal";

import { ThemeProvider } from "@/components/common/ThemeProvider";
import OnboardingGate from "@/components/onboarding/OnboardingGate";
import MissionCompleteToast from "@/components/common/MissionCompleteToast";
import PrivacyProvider from "@/components/layout/PrivacyProvider";
import PageTransitionLoader from "@/components/common/PageTransitionLoader";
import PushPermissionBanner from "@/components/pwa/PushPermissionBanner";

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
  icons: {
    icon: "/aklabs-logo.svg",
    shortcut: "/aklabs-logo.svg",
    apple: "/aklabs-logo.svg",
  },
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
        <link rel="icon" href="/aklabs-logo.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased selection:bg-primary/30 font-sans`}
      >
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          <OnboardingGate>
            <PrivacyProvider>
              <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 w-full overflow-x-hidden">
                {/* Sidebar will show on MD+ screens */}
                <Sidebar />

                {/* Main Content Area */}
                <ClientLayout>{children}</ClientLayout>
              </div>
            </PrivacyProvider>
            <UploadModal />
            <AIReportModal />
            <GuideModal />
            <MissionCompleteToast />
            <PageTransitionLoader />
            <PushPermissionBanner />
          </OnboardingGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
