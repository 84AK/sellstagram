export type AvatarCategory = "헤어" | "머리색" | "눈" | "입" | "옷" | "옷색상" | "액세서리" | "배경색";
export type AvatarRarity = "common" | "rare" | "epic";

export interface AvatarItemDef {
    id: string;
    name: string;
    category: AvatarCategory;
    xpPrice: number;
    slot: keyof AvatarConfig;
    value: string;
    preview: string;
    rarity: AvatarRarity;
    isDefault?: boolean;
}

export interface AvatarConfig {
    top?: string;           // hairstyle / hat
    hairColor?: string;     // hair color (named: black, brown, blonde, etc.)
    eyes?: string;          // eye style
    eyebrows?: string;      // eyebrow style
    mouth?: string;         // mouth style
    clothesType?: string;   // clothing type
    clothesColor?: string;  // clothing color (named)
    accessories?: string;   // accessory (prescription01, sunglasses, etc.)
    backgroundColor?: string; // hex without #
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
    top: "shortFlat",
    hairColor: "black",
    eyes: "default",
    eyebrows: "default",
    mouth: "default",
    clothesType: "hoodie",
    clothesColor: "gray01",
    accessories: "",
    backgroundColor: "ffffff",
};
