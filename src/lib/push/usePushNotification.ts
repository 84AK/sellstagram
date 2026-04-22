"use client";

import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "@/store/useGameStore";
import { supabase } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export function usePushNotification() {
    const { user } = useGameStore();
    const [permission, setPermission] = useState<PushPermission>("default");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isSupported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

    // 초기 상태 동기화
    useEffect(() => {
        if (!isSupported) {
            setPermission("unsupported");
            return;
        }
        setPermission(Notification.permission as PushPermission);

        Promise.race([
            navigator.serviceWorker.ready,
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
        ]).then((reg) => {
            reg.pushManager.getSubscription().then((sub) => {
                setIsSubscribed(!!sub);
            });
        }).catch(() => {});
    }, [isSupported]);

    // 구독 등록
    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;
        setIsLoading(true);
        try {
            // 서비스 워커 등록 여부 먼저 확인 (dev 모드에서는 SW 비활성화)
            const registrations = await navigator.serviceWorker.getRegistrations();
            if (registrations.length === 0) {
                throw new Error("서비스 워커가 등록되지 않았습니다.");
            }

            const permission = await Notification.requestPermission();
            setPermission(permission as PushPermission);
            if (permission !== "granted") return false;

            // 10초 타임아웃 — SW가 활성화되지 않으면 hang 방지
            const swReady = Promise.race([
                navigator.serviceWorker.ready,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("SW ready timeout")), 10000)
                ),
            ]);
            const reg = await swReady;
            const existing = await reg.pushManager.getSubscription();
            if (existing) await existing.unsubscribe();

            const sub = await reg.pushManager.subscribe({
                userVisibleOnly:      true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/push/subscribe", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    subscription: sub.toJSON(),
                    userId:   session?.user?.id || null,
                    userName: user.name || null,
                }),
            });

            if (!res.ok) throw new Error("Failed to save subscription");
            setIsSubscribed(true);
            return true;
        } catch (err) {
            console.error("[push] subscribe error:", err);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, user]);

    // 구독 해제
    const unsubscribe = useCallback(async () => {
        if (!isSupported) return;
        setIsLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                const endpoint = sub.endpoint;
                await sub.unsubscribe();
                await fetch("/api/push/subscribe", {
                    method:  "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify({ endpoint }),
                });
            }
            setIsSubscribed(false);
        } catch (err) {
            console.error("[push] unsubscribe error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [isSupported]);

    return { permission, isSubscribed, isSupported, isLoading, subscribe, unsubscribe };
}
