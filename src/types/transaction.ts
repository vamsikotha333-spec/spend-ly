export interface Transaction {
  id: string;
  type: "credit" | "debit"; // Keep for backward compatibility
  transaction_type?: "Income" | "Expense" | "Savings";
  amount: number;
  category: string;
  description: string;
  date: Date;
  addedBy: string;
  applicable_to?: string;
  investment_id?: string | null;
}

export const TRANSACTION_TYPES = ["Income", "Expense", "Savings"] as const;
// NOTE: ADDED_BY_OPTIONS / APPLICABLE_TO_OPTIONS removed.
// Member names are now dynamic and per-user — load via useMembers() from
// "@/hooks/useMembers". Empty arrays are kept here only for any leftover
// imports during refactor; do not rely on them for UI lists.
export const APPLICABLE_TO_OPTIONS: readonly string[] = [];
export const ADDED_BY_OPTIONS: readonly string[] = [];

export const CATEGORIES = {
  Income: ["💰 Salary", "💻 Freelance", "📈 Investment", "🎁 Gift", "💵 Other Income"],
  Expense: [
    "🏠 Rent & Maintenance",
    "🛒 Groceries",
    "🥦 Vegetables & Fruits",
    "🎬 Entertainment (Movies, Trip Etc.)",
    "🥜 Dry Fruits & Nuts",
    "🔥 Gas Bill",
    "⚡ Power Bill",
    "📶 Wifi Bill",
    "📱 Recharge Bill",
    "🏥 Health & Medical Bills",
    "💧 Water Can",
    "🥗 Dietician",
    "🍽️ Dining (Breakfast, Lunch, Dinner, Snacks)",
    "🛍️ Shopping (Clothes, Shoes Etc.)",
    "🏡 Home Appliances (Grinder, Pipes Etc.)",
    "🙏 Donation",
    "🚆 Travel (Bus, Train Etc.)",
    "💇 Personal Care (Salon, Facials Etc.)",
    "📺 Subscriptions",
    "🏍️ Transportation (Bike, Auto Etc.)",
    "📦 Miscellaneous",
    "🥛 Milk",
    "📋 LIC",
    "⛽ Petrol",
    "🥚 Eggs",
    "👩‍🍳 Cooking Maid",
    "🥗 Diet Food",
    "🏥 Health Insurance",
  ],
  Savings: ["🆘 Emergency Fund", "📊 Investment", "🏦 FD", "🏛️ PPF", "💰 Chitti Amount", "📋 LIC", "💎 Other Savings"],
} as const;
