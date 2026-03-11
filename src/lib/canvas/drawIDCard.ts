/**
 * ID 카드를 Canvas API로 직접 그려 PNG Blob으로 반환합니다.
 * html2canvas / dom-to-image 라이브러리 없이 100% Canvas 기반으로 렌더링하여
 * 폰트·레이아웃 오차가 없습니다.
 */

const RANK_COLORS: Record<string, { text: string; glow: string }> = {
    Beginner:   { text: "#94A3B8", glow: "rgba(148,163,184,0.25)" },
    Explorer:   { text: "#06D6A0", glow: "rgba(6,214,160,0.25)"  },
    Creator:    { text: "#4361EE", glow: "rgba(67,97,238,0.25)"   },
    Influencer: { text: "#FF6B35", glow: "rgba(255,107,53,0.25)"  },
    Marketer:   { text: "#FFC233", glow: "rgba(255,194,51,0.25)"  },
    Teacher:    { text: "#6C3483", glow: "rgba(108,52,131,0.25)"  },
};

async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload  = () => resolve(img);
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = src;
    });
}

function drawPill(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
) {
    const r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
}

export interface IDCardDrawParams {
    name:   string;
    handle: string;
    team:   string;
    rank:   string;
    points: number;
    avatar: string;
}

export async function drawIDCardToBlob(params: IDCardDrawParams): Promise<Blob> {
    const { name, handle, team, rank, points, avatar } = params;

    // 웹폰트 로드 완료 대기
    await document.fonts.ready;

    const S        = 2;   // 레티나 배율
    const W        = 320; // 카드 CSS 너비
    const HEADER_H = 77;
    const AVATAR_H = 240;
    const INFO_H   = 128;
    const H        = HEADER_H + AVATAR_H + INFO_H;

    const canvas    = document.createElement("canvas");
    canvas.width    = W * S;
    canvas.height   = H * S;
    const ctx       = canvas.getContext("2d")!;
    ctx.scale(S, S);

    const rc = RANK_COLORS[rank] ?? RANK_COLORS.Beginner;

    // ── 전체 라운드 클립 ──────────────────────────────────
    const CR = 32;
    ctx.beginPath();
    ctx.moveTo(CR, 0);
    ctx.arcTo(W, 0,  W, H,  CR);
    ctx.arcTo(W, H,  0, H,  CR);
    ctx.arcTo(0, H,  0, 0,  CR);
    ctx.arcTo(0, 0,  W, 0,  CR);
    ctx.closePath();
    ctx.clip();

    // ── 배경 그라디언트 ────────────────────────────────────
    // CSS linear-gradient(160deg, …) → canvas 좌표계 변환
    const aRad = (160 - 90) * Math.PI / 180;
    const diag = Math.sqrt(W * W + H * H);
    const bgGrad = ctx.createLinearGradient(
        W / 2 - Math.cos(aRad) * diag / 2,
        H / 2 - Math.sin(aRad) * diag / 2,
        W / 2 + Math.cos(aRad) * diag / 2,
        H / 2 + Math.sin(aRad) * diag / 2,
    );
    bgGrad.addColorStop(0,   "#1a1a2e");
    bgGrad.addColorStop(0.6, "#16213e");
    bgGrad.addColorStop(1,   "#0f3460");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── 글로우 헬퍼 ───────────────────────────────────────
    const glow = (gx: number, gy: number, r: number, color: string) => {
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
        g.addColorStop(0, color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(gx, gy, r, 0, Math.PI * 2);
        ctx.fill();
    };
    glow(280, 40,     100, rc.glow);
    glow(40,  H - 40, 80,  "rgba(67,97,238,0.15)");

    // ════════════════════════════════
    //  HEADER
    // ════════════════════════════════
    ctx.textBaseline = "top";

    // "SELL"
    ctx.font        = "900 italic 28px Outfit, system-ui, sans-serif";
    ctx.fillStyle   = "#FF6B35";
    ctx.shadowColor = "rgba(255,107,53,0.5)";
    ctx.shadowBlur  = 20;
    ctx.fillText("SELL", 24, 20);
    ctx.shadowBlur  = 0;

    // "STAGRAM®"
    ctx.font        = "900 italic 10px Outfit, system-ui, sans-serif";
    ctx.globalAlpha = 0.7;
    ctx.fillText("STAGRAM®", 24, 51);
    ctx.globalAlpha = 1;

    // MARKETER ID 배지 (우측)
    const MID_X = W - 24 - 18; // 원 중심 X
    ctx.beginPath();
    ctx.arc(MID_X, 30, 10, 0, Math.PI * 2);
    ctx.fillStyle   = "rgba(255,255,255,0.1)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.font         = "700 8px Outfit, system-ui, sans-serif";
    ctx.fillStyle    = "rgba(255,255,255,0.3)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    ctx.fillText("MARKETER ID", MID_X, 44);
    ctx.textAlign    = "left";

    // 헤더 하단 구분선
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_H);
    ctx.lineTo(W, HEADER_H);
    ctx.stroke();

    // ════════════════════════════════
    //  AVATAR
    // ════════════════════════════════
    const AY  = HEADER_H;
    const ACX = W / 2;
    const ACY = AY + AVATAR_H / 2;
    const isUrl = avatar?.startsWith("http");

    const abg = ctx.createLinearGradient(0, AY, 0, AY + AVATAR_H);
    abg.addColorStop(0, isUrl ? "rgba(255,255,255,0.04)" : "rgba(255,107,53,0.08)");
    abg.addColorStop(1, isUrl ? "rgba(255,255,255,0.08)" : "rgba(67,97,238,0.08)");
    ctx.fillStyle = abg;
    ctx.fillRect(0, AY, W, AVATAR_H);

    glow(ACX, ACY, 100, rc.glow);

    if (isUrl) {
        try {
            const img = await loadImage(avatar);
            ctx.drawImage(img, ACX - 90, ACY - 90, 180, 180);
        } catch {
            ctx.font         = "100px serif";
            ctx.textAlign    = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle    = "white";
            ctx.fillText("🦊", ACX, ACY);
        }
    } else {
        ctx.font         = "100px serif";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(avatar || "🦊", ACX, ACY);
    }

    ctx.textAlign    = "left";
    ctx.textBaseline = "top";

    // ════════════════════════════════
    //  INFO
    // ════════════════════════════════
    const IY = HEADER_H + AVATAR_H;

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, IY);
    ctx.lineTo(W, IY);
    ctx.stroke();

    // 이름
    ctx.font         = "900 24px Outfit, system-ui, sans-serif";
    ctx.fillStyle    = "white";
    ctx.textBaseline = "top";
    ctx.fillText(name || "학생", 24, IY + 20);

    // 핸들 + 팀
    ctx.font      = "400 14px Outfit, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(`@${handle} · ${team}`, 24, IY + 50);

    // ── 배지 영역 ──────────────────────────────────────────
    const BY = IY + 80;
    const BH = 25;

    // 랭크 배지
    ctx.font = "900 11px Outfit, system-ui, sans-serif";
    const rankLabel = rank.toUpperCase();
    const rankTW    = ctx.measureText(rankLabel).width;
    const RPX       = 12;
    const RBW       = rankTW + RPX * 2;

    drawPill(ctx, 24, BY, RBW, BH);
    ctx.fillStyle   = rc.text + "33";
    ctx.fill();
    ctx.strokeStyle = rc.text + "66";
    ctx.lineWidth   = 1;
    ctx.stroke();

    ctx.fillStyle    = rc.text;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(rankLabel, 24 + RBW / 2, BY + BH / 2);

    // XP 배지
    const xpLabel = `${points.toLocaleString()} XP`;
    ctx.font       = "900 12px Outfit, system-ui, sans-serif";
    const xpTW     = ctx.measureText(xpLabel).width;
    const XPX      = 10;
    const ISIZ     = 12;
    const IGAP     = 5;
    const XBW      = XPX + ISIZ + IGAP + xpTW + XPX;
    const XX       = 24 + RBW + 12;

    drawPill(ctx, XX, BY, XBW, BH);
    ctx.fillStyle   = "rgba(255,194,51,0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,194,51,0.25)";
    ctx.lineWidth   = 1;
    ctx.stroke();

    // 번개 아이콘 (viewBox 0 0 24 24 → 12×12)
    const BLX = XX + XPX;
    const BLY = BY + (BH - ISIZ) / 2;
    const sc  = ISIZ / 24;
    ctx.beginPath();
    ([[13,2],[3,14],[12,14],[11,22],[21,10],[12,10]] as [number,number][]).forEach(([px, py], i) => {
        const dx = BLX + px * sc;
        const dy = BLY + py * sc;
        i === 0 ? ctx.moveTo(dx, dy) : ctx.lineTo(dx, dy);
    });
    ctx.closePath();
    ctx.fillStyle = "#FFC233";
    ctx.fill();

    // XP 텍스트
    ctx.fillStyle    = "#FFC233";
    ctx.textAlign    = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(xpLabel, BLX + ISIZ + IGAP, BY + BH / 2);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error("toBlob 실패")),
            "image/png",
        );
    });
}
