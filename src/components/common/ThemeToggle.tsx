"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-8 h-8" />;

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            aria-label="테마 전환"
        >
            {theme === "dark" ? (
                <Sun size={15} style={{ color: "var(--highlight)" }} />
            ) : (
                <Moon size={15} style={{ color: "var(--foreground-soft)" }} />
            )}
        </button>
    );
}
