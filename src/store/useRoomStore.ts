import { create } from "zustand";
import { getAssetById } from "@/lib/room/assets";

export interface PlacedItem {
  instanceId: string;  // 배치 인스턴스 고유 ID (uuid-like)
  assetId: string;
  x: number;           // % 위치
  y: number;
  z: 1 | 2 | 3;
  scale: number;
  flipX: boolean;
}

interface RoomState {
  placedItems: PlacedItem[];
  roomTheme: "cozy" | "minimal" | "night" | "nature" | "city" | "retro";

  addItem: (assetId: string) => void;
  removeItem: (instanceId: string) => void;
  moveItem: (instanceId: string, x: number, y: number) => void;
  scaleItem: (instanceId: string, scale: number) => void;
  flipItem: (instanceId: string) => void;
  setRoomTheme: (theme: RoomState["roomTheme"]) => void;
  loadFromStorage: () => void;
}

function saveToStorage(items: PlacedItem[], theme: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("sellstagram_room_items", JSON.stringify(items));
  localStorage.setItem("sellstagram_room_theme", theme);
}

let idCounter = Date.now();
function genId() { return `item_${++idCounter}`; }

export const useRoomStore = create<RoomState>((set, get) => ({
  placedItems: [],
  roomTheme: "cozy",

  addItem: (assetId) => {
    const asset = getAssetById(assetId);
    if (!asset) return;
    const newItem: PlacedItem = {
      instanceId: genId(),
      assetId,
      x: asset.defaultX + Math.random() * 10 - 5,
      y: asset.defaultY + Math.random() * 6 - 3,
      z: asset.defaultZ,
      scale: asset.defaultScale,
      flipX: false,
    };
    const items = [...get().placedItems, newItem];
    saveToStorage(items, get().roomTheme);
    set({ placedItems: items });
  },

  removeItem: (instanceId) => {
    const items = get().placedItems.filter(i => i.instanceId !== instanceId);
    saveToStorage(items, get().roomTheme);
    set({ placedItems: items });
  },

  moveItem: (instanceId, x, y) => {
    const items = get().placedItems.map(i =>
      i.instanceId === instanceId ? { ...i, x, y } : i
    );
    saveToStorage(items, get().roomTheme);
    set({ placedItems: items });
  },

  scaleItem: (instanceId, scale) => {
    const clamped = Math.min(2.0, Math.max(0.5, scale));
    const items = get().placedItems.map(i =>
      i.instanceId === instanceId ? { ...i, scale: clamped } : i
    );
    saveToStorage(items, get().roomTheme);
    set({ placedItems: items });
  },

  flipItem: (instanceId) => {
    const items = get().placedItems.map(i =>
      i.instanceId === instanceId ? { ...i, flipX: !i.flipX } : i
    );
    saveToStorage(items, get().roomTheme);
    set({ placedItems: items });
  },

  setRoomTheme: (theme) => {
    saveToStorage(get().placedItems, theme);
    set({ roomTheme: theme });
  },

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("sellstagram_room_items");
      const theme = localStorage.getItem("sellstagram_room_theme") as RoomState["roomTheme"] | null;
      if (raw) set({ placedItems: JSON.parse(raw) });
      if (theme) set({ roomTheme: theme });
    } catch { /* ignore */ }
  },
}));
