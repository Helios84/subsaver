/**
 * Master category list — single source of truth for all components.
 * Import from here instead of defining locally in each component.
 */

export interface Category {
  value: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { value: "Entertainment",   icon: "🎬", color: "#8B5CF6" },
  { value: "Productivity",    icon: "💼", color: "#D946EF" },
  { value: "Gaming",          icon: "🎮", color: "#06B6D4" },
  { value: "Utilities",       icon: "🔧", color: "#6366F1" },
  { value: "Communication",   icon: "📱", color: "#10B981" },
  { value: "Health & Fitness",icon: "🏋️", color: "#EC4899" },
  { value: "Education",       icon: "📚", color: "#A78BFA" },
  { value: "Food & Delivery", icon: "🍔", color: "#34D399" },
  { value: "News & Media",    icon: "📰", color: "#EAB308" },
  { value: "Finance",         icon: "💳", color: "#F97316" },
  { value: "Other",           icon: "🎨", color: "#64748B" },
];

/** Map category name → color for charts */
export const CAT_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.color])
);

/** Map category name → icon emoji */
export const CAT_ICONS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.icon])
);
