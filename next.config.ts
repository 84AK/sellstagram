import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
    swSrc: "src/sw.ts",
    swDest: "public/sw.js",
    disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
    reactCompiler: true,
    // dev 모드 Turbopack 오류 방지 (빌드는 --webpack 플래그로 실행)
    turbopack: {},
};

export default withSerwist(nextConfig);
