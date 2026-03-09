"use client";

import React, { useState } from "react";
import { buildAvatarUrl } from "@/lib/avatar/items";
import type { AvatarConfig } from "@/lib/avatar/types";

interface AvatarRendererProps {
    config?: AvatarConfig;
    seed?: string;
    legacyAvatar?: string; // emoji or old avatar string
    size?: number;
    className?: string;
}

/**
 * 아바타 렌더러
 * - DiceBear config → SVG URL img
 * - legacyAvatar가 URL이면 img, 이모지면 span, 없으면 이니셜
 */
export default function AvatarRenderer({
    config,
    seed = "default",
    legacyAvatar,
    size = 48,
    className = "",
}: AvatarRendererProps) {
    const [imgError, setImgError] = useState(false);

    // 1. DiceBear config가 있는 경우 → CDN URL
    if (config && Object.keys(config).length > 0 && !imgError) {
        const url = buildAvatarUrl(config, seed, size * 2); // 2x for retina
        return (
            <img
                src={url}
                alt="avatar"
                width={size}
                height={size}
                className={`rounded-full object-cover ${className}`}
                style={{ width: size, height: size }}
                onError={() => setImgError(true)}
            />
        );
    }

    // 2. Legacy avatar (이모지 or URL)
    if (legacyAvatar) {
        if (legacyAvatar.startsWith("http") || legacyAvatar.startsWith("/")) {
            return (
                <img
                    src={legacyAvatar}
                    alt="avatar"
                    width={size}
                    height={size}
                    className={`rounded-full object-cover ${className}`}
                    style={{ width: size, height: size }}
                />
            );
        }
        const fontSize = size > 60 ? "2rem" : size > 36 ? "1.4rem" : "1rem";
        return (
            <span style={{ fontSize, lineHeight: 1 }} className={className}>
                {legacyAvatar}
            </span>
        );
    }

    // 3. 폴백: 이니셜
    const fontSize = size > 60 ? "1.6rem" : size > 36 ? "1rem" : "0.75rem";
    return (
        <span
            className={`font-black text-white ${className}`}
            style={{ fontSize, lineHeight: 1 }}
        >
            ?
        </span>
    );
}
