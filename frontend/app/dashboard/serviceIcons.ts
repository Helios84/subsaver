import {
    Music, Tv, Film, Gamepad2, Cloud,
    Code, Dumbbell, BookOpen, ShoppingCart,
    Coffee, Utensils, Layers, LucideIcon,
    Video, Headphones, Tv2,
    Github, Figma, Slack, Camera, Zap,
    Youtube, Twitter, Instagram, Facebook, Linkedin
} from "lucide-react";

export const SERVICE_ICONS: Record<string, LucideIcon> = {
    // Streaming Video
    "netflix": Tv,
    "youtube": Youtube,
    "youtube premium": Youtube,
    "disney+": Film,
    "disney plus": Film,
    "hulu": Tv,
    "hbo max": Tv,
    "hbo": Tv,
    "amazon prime": Tv2,
    "amazon prime video": Tv2,
    "paramount+": Tv,
    "paramount plus": Tv,
    "peacock": Tv,
    "apple tv": Tv,
    "apple tv+": Tv,

    // Music Streaming
    "spotify": Music,
    "apple music": Music,
    "youtube music": Music,
    "amazon music": Headphones,
    "tidal": Music,
    "soundcloud": Headphones,
    "pandora": Headphones,
    "deezer": Music,

    // Gaming
    "xbox": Gamepad2,
    "xbox game pass": Gamepad2,
    "playstation": Gamepad2,
    "playstation plus": Gamepad2,
    "ps plus": Gamepad2,
    "nintendo": Gamepad2,
    "nintendo switch online": Gamepad2,
    "steam": Gamepad2,
    "epic games": Gamepad2,

    // Cloud/Storage
    "icloud": Cloud,
    "google one": Cloud,
    "google drive": Cloud,
    "dropbox": Cloud,
    "onedrive": Cloud,
    "box": Cloud,

    // Productivity
    "microsoft 365": Code,
    "office 365": Code,
    "adobe": Layers,
    "adobe creative cloud": Layers,
    "notion": Code,
    "evernote": BookOpen,
    "figma": Figma,
    "github": Github,
    "slack": Slack,

    // Fitness
    "gym": Dumbbell,
    "fitness": Dumbbell,
    "peloton": Dumbbell,
    "planet fitness": Dumbbell,
    "la fitness": Dumbbell,
    "24 hour fitness": Dumbbell,

    // Education
    "audible": BookOpen,
    "kindle unlimited": BookOpen,
    "coursera": BookOpen,
    "udemy": BookOpen,
    "skillshare": BookOpen,
    "masterclass": BookOpen,
    "duolingo": BookOpen,

    // Food & Delivery
    "doordash": Utensils,
    "uber eats": Utensils,
    "grubhub": Utensils,
    "postmates": Utensils,
    "instacart": ShoppingCart,

    // Social Media
    "twitter": Twitter,
    "x": Twitter,
    "instagram": Instagram,
    "facebook": Facebook,
    "linkedin": Linkedin,
    "tiktok": Video,

    // Other
    "zoom": Video,
    "canva": Camera,
    "starbucks": Coffee,
    "chatgpt": Zap,
    "openai": Zap,
};

/**
 * Get the appropriate icon for a service name.
 * Returns null if no matching icon is found.
 */
export function getServiceIcon(serviceName: string): LucideIcon | null {
    const normalized = serviceName.toLowerCase().trim();
    return SERVICE_ICONS[normalized] || null;
}
