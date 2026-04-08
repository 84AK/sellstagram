"use client";

import React from "react";
import type { CharacterType } from "@/lib/characters/characters";

export type CharAnim = "idle" | "happy" | "sad" | "curious" | "walk";

import type { EvolutionStage } from "@/lib/characters/characters";

interface CharacterSVGProps {
  type: CharacterType;
  size?: number;
  className?: string;
  anim?: CharAnim;
  colorFilter?: string;   // 캐릭터 변형 CSS filter
  skinFilter?: string;    // 스킨 CSS filter
  stage?: EvolutionStage; // 진화 오버레이
  stageColor?: string;    // growth 글로우 색상
}

/* ─── 진화 오버레이 ─── */
function EvolutionOverlay({ stage, size, color }: { stage: EvolutionStage; size: number; color?: string }) {
  if (stage === "growth") return (
    <div style={{
      position: "absolute", inset: -6, borderRadius: "50%", pointerEvents: "none",
      boxShadow: `0 0 18px 7px ${color ?? "#FFD700"}55, 0 0 32px 14px ${color ?? "#FFD700"}22`,
    }} />
  );
  if (stage === "master") return (
    <>
      {/* 황금 오라 */}
      <div style={{
        position: "absolute", inset: -8, borderRadius: "50%", pointerEvents: "none",
        boxShadow: `0 0 24px 10px #FFD70060, 0 0 48px 20px #FFD70025`,
        animation: "masterAura 2s ease-in-out infinite",
      }} />
      {/* 왕관 */}
      <div style={{ position: "absolute", top: -size * 0.2, left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }}>
        <svg width={size * 0.38} height={size * 0.24} viewBox="0 0 38 24" fill="none">
          <polygon points="0,24 9,4 19,14 29,4 38,24" fill="#FFD700" stroke="#FFA500" strokeWidth="1.2"/>
          <circle cx="0"  cy="24" r="3.5" fill="#FFD700"/>
          <circle cx="19" cy="14" r="3"   fill="#FFF8A0"/>
          <circle cx="38" cy="24" r="3.5" fill="#FFD700"/>
          <circle cx="9"  cy="4"  r="2"   fill="#FFF8A0"/>
          <circle cx="29" cy="4"  r="2"   fill="#FFF8A0"/>
        </svg>
      </div>
      {/* 파티클 */}
      {(["✨","⭐","✨","⭐"] as const).map((s, i) => (
        <span key={i} style={{
          position: "absolute", fontSize: size * 0.12,
          left: `${[10, 72, 18, 65][i]}%`,
          top:  `${[5,  8,  75, 72][i]}%`,
          animation: `masterSpark 1.8s ${i * 0.45}s ease-in-out infinite`,
          pointerEvents: "none",
        }}>{s}</span>
      ))}
    </>
  );
  return null;
}

/* ─── 감정 눈 오버레이 ─── */
function EyeOverlay({ anim, lx, ly, rx, ry, r, face, eye }: {
  anim: CharAnim; lx: number; ly: number; rx: number; ry: number;
  r: number; face: string; eye: string;
}) {
  if (anim === "idle" || anim === "walk") return null;
  const pad = r + 2;

  if (anim === "happy") return (
    <g>
      <ellipse cx={lx} cy={ly} rx={pad} ry={pad} fill={face}/>
      <ellipse cx={rx} cy={ry} rx={pad} ry={pad} fill={face}/>
      <path d={`M${lx-r} ${ly+2} Q${lx} ${ly-r+2} ${lx+r} ${ly+2}`} stroke={eye} strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      <path d={`M${rx-r} ${ry+2} Q${rx} ${ry-r+2} ${rx+r} ${ry+2}`} stroke={eye} strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      <ellipse cx={lx-r-6} cy={ly+r} rx="9" ry="5" fill="#FF85A1" opacity="0.4"/>
      <ellipse cx={rx+r+6} cy={ry+r} rx="9" ry="5" fill="#FF85A1" opacity="0.4"/>
    </g>
  );
  if (anim === "sad") return (
    <g>
      <ellipse cx={lx} cy={ly} rx={pad} ry={pad} fill={face}/>
      <ellipse cx={rx} cy={ry} rx={pad} ry={pad} fill={face}/>
      <path d={`M${lx-r+2} ${ly-3} Q${lx} ${ly+r-3} ${lx+r-2} ${ly-3}`} stroke={eye} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d={`M${rx-r+2} ${ry-3} Q${rx} ${ry+r-3} ${rx+r-2} ${ry-3}`} stroke={eye} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <ellipse cx={lx} cy={ly+r+5} rx="3" ry="5" fill="#90CAF9" opacity="0.8"/>
      <ellipse cx={rx} cy={ry+r+5} rx="3" ry="5" fill="#90CAF9" opacity="0.8"/>
    </g>
  );
  if (anim === "curious") return (
    <g>
      <ellipse cx={lx} cy={ly} rx={pad} ry={pad} fill={face}/>
      <ellipse cx={rx} cy={ry} rx={pad} ry={pad} fill={face}/>
      <circle cx={lx} cy={ly} r={r} fill={eye}/>
      <circle cx={lx+4} cy={ly-4} r={r*0.36} fill="white"/>
      <circle cx={rx} cy={ry} r={r*0.65} fill={eye}/>
      <circle cx={rx+3} cy={ry-3} r={r*0.24} fill="white"/>
      <text x={rx+r+2} y={ry-r-1} fontSize="13" fill={eye} fontWeight="900">?</text>
    </g>
  );
  return null;
}

/* ════════════════════════════════════════
   PIXIE — 분홍 여우
   arm-l  transform-origin: 18 102  (왼쪽 어깨)
   arm-r  transform-origin: 132 102 (오른쪽 어깨)
   foot-l transform-origin: 57 133  (왼쪽 엉덩이)
   foot-r transform-origin: 93 133  (오른쪽 엉덩이)
════════════════════════════════════════ */
function Pixie({ size, anim }: { size: number; anim: CharAnim }) {
  const w = anim === "walk";
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow:"visible" }}>
      <defs><style>{`
        .px-body {
          animation: ${w ? "pxWalkBob 0.45s ease-in-out infinite" : "pxFloat 3.2s ease-in-out infinite"};
        }
        @keyframes pxFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pxWalkBob { 0%,100%{transform:translateY(0) rotate(-.8deg)} 50%{transform:translateY(-5px) rotate(.8deg)} }

        .px-eye { transform-box:fill-box; transform-origin:center; animation:pxBlink 5s .4s infinite; }
        @keyframes pxBlink { 0%,88%,100%{transform:scaleY(1)} 91%,95%{transform:scaleY(0.07)} }

        .px-tail {
          transform-box:view-box; transform-origin:105px 132px;
          animation: pxTail ${w ? ".45s" : "2.2s"} ease-in-out infinite;
        }
        @keyframes pxTail { 0%,100%{transform:rotate(0deg)} 30%{transform:rotate(-14deg)} 70%{transform:rotate(14deg)} }

        /* ── 팔 스윙 ── */
        .px-arm-l {
          transform-box:view-box; transform-origin:18px 102px;
          animation: ${w ? "pxArmL .45s ease-in-out infinite" : "none"};
        }
        .px-arm-r {
          transform-box:view-box; transform-origin:132px 102px;
          animation: ${w ? "pxArmR .45s .16s ease-in-out infinite" : "pxBrush 3s ease-in-out infinite"};
        }
        @keyframes pxArmL { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)} }
        @keyframes pxArmR { 0%,100%{transform:rotate(22deg)}  50%{transform:rotate(-22deg)} }
        @keyframes pxBrush { 0%,100%{transform:rotate(0deg)} 35%{transform:rotate(-7deg)} 75%{transform:rotate(6deg)} }

        /* ── 발 스텝 ── */
        .px-foot-l {
          transform-box:view-box; transform-origin:57px 133px;
          animation: ${w ? "pxFootL .45s ease-in-out infinite" : "none"};
        }
        .px-foot-r {
          transform-box:view-box; transform-origin:93px 133px;
          animation: ${w ? "pxFootR .45s .16s ease-in-out infinite" : "none"};
        }
        @keyframes pxFootL { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-8px)} }
        @keyframes pxFootR { 0%,100%{transform:translateY(-8px)} 50%{transform:translateY(0)} }
      `}</style></defs>

      <g className="px-body">
        {/* 꼬리 */}
        <g className="px-tail">
          <ellipse cx="115" cy="115" r="25" fill="#FFB3CC"/>
          <ellipse cx="120" cy="110" r="15" fill="#FFF0F5"/>
        </g>
        {/* 귀 */}
        <polygon points="30,72 44,24 64,68" fill="#FFB3CC"/>
        <polygon points="37,68 45,34 59,65" fill="#FFE0EC"/>
        <polygon points="86,68 106,24 120,72" fill="#FFB3CC"/>
        <polygon points="91,65 105,34 113,68" fill="#FFE0EC"/>
        {/* 머리 */}
        <ellipse cx="75" cy="82" rx="50" ry="46" fill="#FFD4E4"/>
        {/* 눈 */}
        <g className="px-eye"><circle cx="53" cy="78" r="13" fill="#241020"/><circle cx="57" cy="73" r="4.5" fill="white"/><circle cx="50" cy="82" r="2" fill="white" opacity="0.6"/></g>
        <g className="px-eye"><circle cx="97" cy="78" r="13" fill="#241020"/><circle cx="101" cy="73" r="4.5" fill="white"/><circle cx="94" cy="82" r="2" fill="white" opacity="0.6"/></g>
        {/* 코·입·볼 */}
        <ellipse cx="75" cy="91" rx="5" ry="3.5" fill="#FF85A1"/>
        <path d="M 66 98 Q 75 107 84 98" stroke="#C84070" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="34" cy="88" rx="10" ry="6" fill="#FF85A1" opacity="0.28"/>
        <ellipse cx="116" cy="88" rx="10" ry="6" fill="#FF85A1" opacity="0.28"/>
        {/* 왼팔 */}
        <g className="px-arm-l">
          <ellipse cx="18" cy="112" rx="12" ry="8" fill="#FFB3CC" transform="rotate(-35 18 112)"/>
        </g>
        {/* 오른팔+붓 */}
        <g className="px-arm-r">
          <ellipse cx="132" cy="112" rx="12" ry="8" fill="#FFB3CC" transform="rotate(35 132 112)"/>
          <line x1="130" y1="100" x2="136" y2="124" stroke="#8B5E3C" strokeWidth="5" strokeLinecap="round"/>
          <circle cx="127" cy="97" r="6" fill="#4361EE"/>
          <circle cx="127" cy="97" r="3" fill="#6B8FFF"/>
        </g>
        {/* 왼발 */}
        <g className="px-foot-l"><ellipse cx="57" cy="142" rx="16" ry="9" fill="#FFB3CC"/></g>
        {/* 오른발 */}
        <g className="px-foot-r"><ellipse cx="93" cy="142" rx="16" ry="9" fill="#FFB3CC"/></g>
        <EyeOverlay anim={anim} lx={53} ly={78} rx={97} ry={78} r={13} face="#FFD4E4" eye="#241020"/>
      </g>
    </svg>
  );
}

/* ════════════════════════════════════════
   LUMI — 파란 부엉이
   wing-l transform-origin: 22 108
   wing-r transform-origin: 128 108
   foot-l transform-origin: 57 133
   foot-r transform-origin: 93 133
════════════════════════════════════════ */
function Lumi({ size, anim }: { size: number; anim: CharAnim }) {
  const w = anim === "walk";
  const wSpd = w ? ".18s" : "2s";
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow:"visible" }}>
      <defs><style>{`
        .lu-body { animation: ${w ? "luWalkBob .45s ease-in-out infinite" : "luFloat 4s ease-in-out infinite"}; }
        @keyframes luFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes luWalkBob { 0%,100%{transform:translateY(0) rotate(-.6deg)} 50%{transform:translateY(-4px) rotate(.6deg)} }

        .lu-eye { transform-box:fill-box; transform-origin:center; animation:luBlink 5.5s 1.2s infinite; }
        @keyframes luBlink { 0%,86%,100%{transform:scaleY(1)} 89%,93%{transform:scaleY(0.07)} }
        .lu-head { transform-box:view-box; transform-origin:75px 95px; animation:luTilt 5s ease-in-out infinite; }
        @keyframes luTilt { 0%,100%{transform:rotate(0deg)} 30%{transform:rotate(-4deg)} 70%{transform:rotate(4deg)} }

        /* 날개 = 팔 역할 */
        .lu-wing-l {
          transform-box:view-box; transform-origin:22px 108px;
          animation: luWingL ${wSpd} ${w?"":"ease-in-out"} infinite;
        }
        .lu-wing-r {
          transform-box:view-box; transform-origin:128px 108px;
          animation: luWingR ${wSpd} ${w ? ".16s" : ".2s"} ${w?"":"ease-in-out"} infinite;
        }
        @keyframes luWingL { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(${w?"-22deg":"-10deg"})} }
        @keyframes luWingR { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(${w?"22deg":"10deg"})} }

        /* 발 */
        .lu-foot-l {
          transform-box:view-box; transform-origin:57px 133px;
          animation: ${w ? "luFootL .45s ease-in-out infinite" : "none"};
        }
        .lu-foot-r {
          transform-box:view-box; transform-origin:93px 133px;
          animation: ${w ? "luFootR .45s .16s ease-in-out infinite" : "none"};
        }
        @keyframes luFootL { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-7px)} }
        @keyframes luFootR { 0%,100%{transform:translateY(-7px)} 50%{transform:translateY(0)} }
      `}</style></defs>

      <g className="lu-body">
        {/* 귀 뭉치 */}
        <ellipse cx="46" cy="38" rx="12" ry="22" fill="#A0BEFF" transform="rotate(-12 46 38)"/>
        <ellipse cx="46" cy="38" rx="6.5" ry="14" fill="#D4E8FF" transform="rotate(-12 46 38)"/>
        <ellipse cx="104" cy="38" rx="12" ry="22" fill="#A0BEFF" transform="rotate(12 104 38)"/>
        <ellipse cx="104" cy="38" rx="6.5" ry="14" fill="#D4E8FF" transform="rotate(12 104 38)"/>
        {/* 머리 */}
        <g className="lu-head">
          <circle cx="75" cy="82" r="50" fill="#C8DCFF"/>
          <ellipse cx="75" cy="88" rx="36" ry="34" fill="#EEF5FF" opacity="0.6"/>
          <g className="lu-eye"><circle cx="53" cy="77" r="15" fill="#1A2B4C"/><circle cx="58" cy="72" r="5" fill="white"/><circle cx="50" cy="81" r="2.5" fill="white" opacity="0.6"/></g>
          <g className="lu-eye"><circle cx="97" cy="77" r="15" fill="#1A2B4C"/><circle cx="102" cy="72" r="5" fill="white"/><circle cx="94" cy="81" r="2.5" fill="white" opacity="0.6"/></g>
          <circle cx="53" cy="77" r="17.5" fill="none" stroke="#7EAAFF" strokeWidth="3"/>
          <circle cx="97" cy="77" r="17.5" fill="none" stroke="#7EAAFF" strokeWidth="3"/>
          <path d="M 70.5 76 Q 75 72 79.5 76" stroke="#7EAAFF" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <line x1="35.5" y1="69" x2="27" y2="63" stroke="#7EAAFF" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="114.5" y1="69" x2="123" y2="63" stroke="#7EAAFF" strokeWidth="2.5" strokeLinecap="round"/>
          <polygon points="75,92 70,101 80,101" fill="#FFD166"/>
          <ellipse cx="32" cy="90" rx="10" ry="6" fill="#A0BEFF" opacity="0.35"/>
          <ellipse cx="118" cy="90" rx="10" ry="6" fill="#A0BEFF" opacity="0.35"/>
          <EyeOverlay anim={anim} lx={53} ly={77} rx={97} ry={77} r={15} face="#C8DCFF" eye="#1A2B4C"/>
        </g>
        {/* 날개 */}
        <g className="lu-wing-l">
          <ellipse cx="18" cy="112" rx="14" ry="9" fill="#A0BEFF" transform="rotate(-22 18 112)"/>
          <path d="M 8 118 Q 13 110 22 113" stroke="#7AAAEE" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M 7 123 Q 13 115 21 119" stroke="#7AAAEE" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </g>
        <g className="lu-wing-r">
          <ellipse cx="132" cy="112" rx="14" ry="9" fill="#A0BEFF" transform="rotate(22 132 112)"/>
          <rect x="118" y="99" width="22" height="26" rx="3" fill="white" stroke="#C0D8FF" strokeWidth="1.5"/>
          <rect x="124" y="96" width="10" height="7" rx="2.5" fill="#7EAAFF"/>
          <line x1="121" y1="108" x2="137" y2="108" stroke="#C0D8FF" strokeWidth="1.5"/>
          <line x1="121" y1="113" x2="137" y2="113" stroke="#C0D8FF" strokeWidth="1.5"/>
          <line x1="121" y1="118" x2="132" y2="118" stroke="#C0D8FF" strokeWidth="1.5"/>
        </g>
        {/* 발 */}
        <g className="lu-foot-l">
          <ellipse cx="57" cy="142" rx="16" ry="9" fill="#A0BEFF"/>
          <line x1="49" y1="144" x2="45" y2="150" stroke="#7AAAEE" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="55" y1="145" x2="53" y2="151" stroke="#7AAAEE" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="61" y1="145" x2="61" y2="151" stroke="#7AAAEE" strokeWidth="2.5" strokeLinecap="round"/>
        </g>
        <g className="lu-foot-r">
          <ellipse cx="93" cy="142" rx="16" ry="9" fill="#A0BEFF"/>
          <line x1="85" y1="144" x2="81" y2="150" stroke="#7AAAEE" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="91" y1="145" x2="89" y2="151" stroke="#7AAAEE" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="97" y1="145" x2="97" y2="151" stroke="#7AAAEE" strokeWidth="2.5" strokeLinecap="round"/>
        </g>
      </g>
    </svg>
  );
}

/* ════════════════════════════════════════
   MOKI — 황금 너구리
════════════════════════════════════════ */
function Moki({ size, anim }: { size: number; anim: CharAnim }) {
  const w = anim === "walk";
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow:"visible" }}>
      <defs><style>{`
        .mo-body { animation: ${w ? "moWalkBob .45s ease-in-out infinite" : "moFloat 2.8s ease-in-out infinite"}; }
        @keyframes moFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes moWalkBob { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-6px) rotate(1deg)} }

        .mo-eye { transform-box:fill-box; transform-origin:center; animation:moBlink 4.8s .8s infinite; }
        @keyframes moBlink { 0%,87%,100%{transform:scaleY(1)} 90%,94%{transform:scaleY(0.07)} }

        .mo-tail {
          transform-box:view-box; transform-origin:108px 138px;
          animation: moTail ${w ? ".45s" : "2.5s"} ease-in-out infinite;
        }
        @keyframes moTail { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-13deg)} 75%{transform:rotate(13deg)} }

        .mo-mouth     { animation: moMouth 3.5s ease-in-out infinite; }
        @keyframes moMouth     { 0%,60%,100%{opacity:1} 70%,90%{opacity:0} }
        .mo-mouth-talk{ animation: moMouthTalk 3.5s ease-in-out infinite; }
        @keyframes moMouthTalk { 0%,60%,100%{opacity:0} 70%,90%{opacity:1} }

        /* 팔 */
        .mo-arm-l {
          transform-box:view-box; transform-origin:18px 105px;
          animation: ${w ? "moArmL .45s ease-in-out infinite" : "none"};
        }
        .mo-arm-r {
          transform-box:view-box; transform-origin:132px 105px;
          animation: ${w ? "moArmR .45s .16s ease-in-out infinite" : "none"};
        }
        @keyframes moArmL { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(20deg)} }
        @keyframes moArmR { 0%,100%{transform:rotate(20deg)}  50%{transform:rotate(-20deg)} }

        /* 발 */
        .mo-foot-l {
          transform-box:view-box; transform-origin:57px 133px;
          animation: ${w ? "moFootL .45s ease-in-out infinite" : "none"};
        }
        .mo-foot-r {
          transform-box:view-box; transform-origin:93px 133px;
          animation: ${w ? "moFootR .45s .16s ease-in-out infinite" : "none"};
        }
        @keyframes moFootL { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-9px)} }
        @keyframes moFootR { 0%,100%{transform:translateY(-9px)} 50%{transform:translateY(0)} }
      `}</style></defs>

      <g className="mo-body">
        <g className="mo-tail">
          <ellipse cx="122" cy="118" rx="20" ry="28" fill="#FFC233" transform="rotate(18 122 118)"/>
          <ellipse cx="119" cy="107" rx="9" ry="7" fill="#8B6914" transform="rotate(18 119 107)" opacity="0.3"/>
          <ellipse cx="122" cy="120" rx="9" ry="7" fill="#8B6914" transform="rotate(18 122 120)" opacity="0.3"/>
          <ellipse cx="120" cy="133" rx="8" ry="6" fill="#8B6914" transform="rotate(18 120 133)" opacity="0.25"/>
          <ellipse cx="116" cy="118" rx="5" ry="24" fill="#FFF8E0" transform="rotate(18 116 118)" opacity="0.7"/>
        </g>
        <circle cx="40" cy="40" r="18" fill="#FFC233"/><circle cx="40" cy="40" r="10" fill="#FFE8B0"/>
        <circle cx="110" cy="40" r="18" fill="#FFC233"/><circle cx="110" cy="40" r="10" fill="#FFE8B0"/>
        <ellipse cx="75" cy="82" rx="50" ry="46" fill="#FFE8B0"/>
        <ellipse cx="53" cy="77" rx="17" ry="13" fill="#5C3A10" opacity="0.10"/>
        <ellipse cx="97" cy="77" rx="17" ry="13" fill="#5C3A10" opacity="0.10"/>
        <g className="mo-eye"><circle cx="53" cy="77" r="13" fill="#201008"/><circle cx="57" cy="72" r="4.5" fill="white"/><circle cx="50" cy="81" r="2" fill="white" opacity="0.55"/></g>
        <g className="mo-eye"><circle cx="97" cy="77" r="13" fill="#201008"/><circle cx="101" cy="72" r="4.5" fill="white"/><circle cx="94" cy="81" r="2" fill="white" opacity="0.55"/></g>
        <ellipse cx="75" cy="90" rx="5.5" ry="4" fill="#6B4020"/>
        <g className="mo-mouth">
          <path d="M 63 98 Q 75 113 87 98 Z" fill="#FF8855"/>
          <path d="M 63 98 Q 75 113 87 98" stroke="#6B4020" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <line x1="72" y1="98" x2="72" y2="104" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="78" y1="98" x2="78" y2="104" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        </g>
        <g className="mo-mouth-talk">
          <path d="M 63 99 Q 75 108 87 99" stroke="#6B4020" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </g>
        <ellipse cx="34" cy="90" rx="11" ry="6" fill="#FFAA33" opacity="0.28"/>
        <ellipse cx="116" cy="90" rx="11" ry="6" fill="#FFAA33" opacity="0.28"/>
        {/* 왼팔 */}
        <g className="mo-arm-l">
          <ellipse cx="18" cy="114" rx="13" ry="8" fill="#FFC233" transform="rotate(-28 18 114)"/>
        </g>
        {/* 오른팔+책 */}
        <g className="mo-arm-r">
          <ellipse cx="132" cy="114" rx="13" ry="8" fill="#FFC233" transform="rotate(28 132 114)"/>
          <path d="M 103 100 Q 116 96 116 122 L 103 126 Z" fill="#FFFAE8" stroke="#E0D0A0" strokeWidth="1.2"/>
          <path d="M 116 100 Q 129 96 132 122 L 116 122 Z" fill="white" stroke="#E0D0A0" strokeWidth="1.2"/>
          <line x1="106" y1="107" x2="114" y2="106" stroke="#C8B880" strokeWidth="1.2"/>
          <line x1="106" y1="112" x2="114" y2="111" stroke="#C8B880" strokeWidth="1.2"/>
          <line x1="118" y1="107" x2="129" y2="106" stroke="#C8B880" strokeWidth="1.2"/>
          <line x1="118" y1="112" x2="129" y2="111" stroke="#C8B880" strokeWidth="1.2"/>
        </g>
        {/* 발 */}
        <g className="mo-foot-l"><ellipse cx="57" cy="142" rx="16" ry="9" fill="#FFC233"/></g>
        <g className="mo-foot-r"><ellipse cx="93" cy="142" rx="16" ry="9" fill="#FFC233"/></g>
        <EyeOverlay anim={anim} lx={53} ly={77} rx={97} ry={77} r={13} face="#FFE8B0" eye="#201008"/>
      </g>
    </svg>
  );
}

/* ════════════════════════════════════════
   ZETA — 보라 토끼
════════════════════════════════════════ */
function Zeta({ size, anim }: { size: number; anim: CharAnim }) {
  const w = anim === "walk";
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow:"visible" }}>
      <defs><style>{`
        .zt-body { animation: ${w ? "ztWalkBob .45s ease-in-out infinite" : "ztFloat 3s ease-in-out infinite"}; }
        @keyframes ztFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ztWalkBob { 0%,100%{transform:translateY(0) rotate(-.8deg)} 50%{transform:translateY(-5px) rotate(.8deg)} }

        .zt-eye { transform-box:fill-box; transform-origin:center; animation:ztBlink 5.2s 1.6s infinite; }
        @keyframes ztBlink { 0%,89%,100%{transform:scaleY(1)} 92%,96%{transform:scaleY(0.07)} }

        .zt-ear-l { transform-box:view-box; transform-origin:55px 65px; animation:ztEarL 2s ease-in-out infinite; }
        @keyframes ztEarL { 0%,100%{transform:rotate(0deg)} 30%{transform:rotate(-6deg)} 70%{transform:rotate(4deg)} }
        .zt-ear-r { transform-box:view-box; transform-origin:95px 65px; animation:ztEarR 2s .3s ease-in-out infinite; }
        @keyframes ztEarR  { 0%,100%{transform:rotate(0deg)} 30%{transform:rotate(6deg)} 70%{transform:rotate(-4deg)} }

        .zt-spark1{animation:ztSpark 2.4s 0s ease-in-out infinite;}
        .zt-spark2{animation:ztSpark 2.4s .6s ease-in-out infinite;}
        .zt-spark3{animation:ztSpark 2.4s 1.2s ease-in-out infinite;}
        .zt-spark4{animation:ztSpark 2.4s 1.8s ease-in-out infinite;}
        @keyframes ztSpark{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}

        /* 팔 */
        .zt-arm-l {
          transform-box:view-box; transform-origin:18px 100px;
          animation: ${w ? "ztArmL .45s ease-in-out infinite" : "ztBolt 1.5s ease-in-out infinite"};
        }
        .zt-arm-r {
          transform-box:view-box; transform-origin:132px 100px;
          animation: ${w ? "ztArmR .45s .16s ease-in-out infinite" : "none"};
        }
        @keyframes ztBolt { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-8deg)} }
        @keyframes ztArmL { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(20deg)} }
        @keyframes ztArmR { 0%,100%{transform:rotate(20deg)}  50%{transform:rotate(-20deg)} }

        /* 발 */
        .zt-foot-l {
          transform-box:view-box; transform-origin:57px 135px;
          animation: ${w ? "ztFootL .45s ease-in-out infinite" : "none"};
        }
        .zt-foot-r {
          transform-box:view-box; transform-origin:93px 135px;
          animation: ${w ? "ztFootR .45s .16s ease-in-out infinite" : "none"};
        }
        @keyframes ztFootL { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-9px)} }
        @keyframes ztFootR { 0%,100%{transform:translateY(-9px)}  50%{transform:translateY(0)} }
      `}</style></defs>

      <g className="zt-body">
        <circle cx="22" cy="32" r="3.5" fill="#FFD700" className="zt-spark1" style={{transformBox:"fill-box",transformOrigin:"center"}}/>
        <circle cx="128" cy="28" r="2.5" fill="#FFD700" className="zt-spark2" style={{transformBox:"fill-box",transformOrigin:"center"}}/>
        <circle cx="134" cy="52" r="2" fill="#C8A8F8" className="zt-spark3" style={{transformBox:"fill-box",transformOrigin:"center"}}/>
        <circle cx="15" cy="55" r="2" fill="#C8A8F8" className="zt-spark4" style={{transformBox:"fill-box",transformOrigin:"center"}}/>
        {/* 귀 */}
        <g className="zt-ear-l">
          <ellipse cx="51" cy="36" rx="13" ry="32" fill="#C8A8F8" transform="rotate(-8 51 36)"/>
          <ellipse cx="51" cy="36" rx="7" ry="23" fill="#F0E4FF" transform="rotate(-8 51 36)"/>
          <polyline points="54,12 48,26 55,26 47,42" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <g className="zt-ear-r">
          <ellipse cx="99" cy="36" rx="13" ry="32" fill="#C8A8F8" transform="rotate(8 99 36)"/>
          <ellipse cx="99" cy="36" rx="7" ry="23" fill="#F0E4FF" transform="rotate(8 99 36)"/>
        </g>
        <ellipse cx="75" cy="86" rx="50" ry="46" fill="#E8D8FF"/>
        <g className="zt-eye"><circle cx="53" cy="81" r="13" fill="#180828"/><circle cx="57" cy="76" r="4.5" fill="white"/><circle cx="50" cy="85" r="2" fill="white" opacity="0.55"/><path d="M 46 74 L 47.5 77 L 51 76" stroke="white" strokeWidth="1.2" fill="none" opacity="0.5" strokeLinecap="round"/></g>
        <g className="zt-eye"><circle cx="97" cy="81" r="13" fill="#180828"/><circle cx="101" cy="76" r="4.5" fill="white"/><circle cx="94" cy="85" r="2" fill="white" opacity="0.55"/></g>
        <polygon points="75,93 70,100 80,100" fill="#C8A8F8"/>
        <path d="M 64 104 Q 75 115 86 104" stroke="#7030B8" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="33" cy="93" rx="11" ry="6" fill="#BB88FF" opacity="0.26"/>
        <ellipse cx="117" cy="93" rx="11" ry="6" fill="#BB88FF" opacity="0.26"/>
        {/* 왼팔+번개 */}
        <g className="zt-arm-l">
          <ellipse cx="18" cy="108" rx="12" ry="8" fill="#C8A8F8" transform="rotate(-45 18 108)"/>
          <polyline points="20,92 14,107 22,107 14,124" fill="none" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        {/* 오른팔 */}
        <g className="zt-arm-r">
          <ellipse cx="132" cy="108" rx="12" ry="8" fill="#C8A8F8" transform="rotate(45 132 108)"/>
        </g>
        {/* 발 */}
        <g className="zt-foot-l"><ellipse cx="57" cy="144" rx="18" ry="10" fill="#C8A8F8"/></g>
        <g className="zt-foot-r"><ellipse cx="93" cy="144" rx="18" ry="10" fill="#C8A8F8"/></g>
        <EyeOverlay anim={anim} lx={53} ly={81} rx={97} ry={81} r={13} face="#E8D8FF" eye="#180828"/>
      </g>
    </svg>
  );
}

/* ─── 래퍼 애니메이션 ─── */
const WRAPPER_ANIM: Record<CharAnim, string | undefined> = {
  idle:    undefined,
  walk:    undefined,                               // 움직임은 PartnerRoom RAF가 담당
  happy:   "charBounce 0.65s ease-out",
  sad:     "charSlump 2.5s ease-in-out infinite",
  curious: "charTilt 1.2s ease-in-out",
};

const CHAR_MAP: Record<CharacterType, React.FC<{ size: number; anim: CharAnim }>> = {
  creator: Pixie, analyst: Lumi, storyteller: Moki, innovator: Zeta,
};

export default function CharacterSVG({
  type, size = 150, className, anim = "idle",
  colorFilter, skinFilter, stage, stageColor,
}: CharacterSVGProps) {
  const C = CHAR_MAP[type];
  if (!C) return null;

  const combinedFilter = [colorFilter, skinFilter].filter(Boolean).join(" ") || undefined;
  const eggStyle = stage === "egg" ? "grayscale(0.35) brightness(1.05)" : undefined;
  const finalFilter = [eggStyle, combinedFilter].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        position: "relative",
        animation: WRAPPER_ANIM[anim],
        filter: finalFilter,
      }}
    >
      {stage && <EvolutionOverlay stage={stage} size={size} color={stageColor} />}
      <C size={size} anim={anim} />
    </div>
  );
}
