import {
  Home, ShoppingCart, Carrot, UtensilsCrossed, Car, HeartPulse, ShoppingBag, Lightbulb,
  GraduationCap, Clapperboard, Fuel, ShieldCheck, Landmark, Smartphone, Shirt, Scissors,
  Gift, Plane, Wrench, Phone, Globe, Briefcase, TrendingUp, Package, Milk, Egg, Nut,
  Droplets, Salad, ChefHat, HandHeart, Train, Tv, Bike, PiggyBank, LifeBuoy, FileText,
  Wallet, Coins, Baby, Heart, Dumbbell, type LucideIcon,
} from "lucide-react";

/** keyword → icon. First match wins, so order matters (most specific first). */
const RULES: [RegExp, LucideIcon][] = [
  [/health insurance|insurance|lic/, ShieldCheck],
  [/rent|maintenance|home applianc|house/, Home],
  [/grocer/, ShoppingCart],
  [/vegetable|fruit/, Carrot],
  [/dry fruit|nut/, Nut],
  [/dining|restaurant|breakfast|lunch|dinner|snack/, UtensilsCrossed],
  [/diet food|dietician|salad/, Salad],
  [/milk/, Milk],
  [/egg/, Egg],
  [/water/, Droplets],
  [/cooking maid|maid|chef/, ChefHat],
  [/entertainment|movie|cinema/, Clapperboard],
  [/subscription/, Tv],
  [/gas bill|power bill|electric|utilit/, Lightbulb],
  [/wifi|internet/, Globe],
  [/recharge|phone|mobile/, Smartphone],
  [/telecom|call/, Phone],
  [/health|medical|hospital|doctor/, HeartPulse],
  [/shopping|clothes|shoe|apparel/, ShoppingBag],
  [/clothing|shirt/, Shirt],
  [/donation|charity/, HandHeart],
  [/travel|flight|trip/, Plane],
  [/train|bus/, Train],
  [/transport|auto|bike/, Bike],
  [/petrol|diesel|fuel/, Fuel],
  [/personal care|salon|facial|grooming/, Scissors],
  [/education|school|college|tuition/, GraduationCap],
  [/gift/, Gift],
  [/repair|tool|servic/, Wrench],
  [/salary|payroll|job/, Briefcase],
  [/freelance|contract/, Wallet],
  [/investment|stock|mutual|sip|equity/, TrendingUp],
  [/emergency/, LifeBuoy],
  [/fd|ppf|epf|bank|deposit|chitti|chit/, Landmark],
  [/saving/, PiggyBank],
  [/gold|coin|bullion/, Coins],
  [/car|vehicle/, Car],
  [/baby|child/, Baby],
  [/wedding|marriage/, Heart],
  [/gym|fitness|sport/, Dumbbell],
  [/document|paper|bill/, FileText],
];

/** Strip emoji/pictographs so stored category names render as clean text. */
export function categoryLabel(raw?: string | null): string {
  if (!raw) return "";
  return String(raw)
    .replace(/[\u2190-\u21FF\u2600-\u27BF\u{1F000}-\u{1FAFF}\uFE0F\u200D]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getCategoryIcon(raw?: string | null): LucideIcon {
  const name = categoryLabel(raw).toLowerCase();
  for (const [re, Icon] of RULES) if (re.test(name)) return Icon;
  return Package;
}

interface CategoryIconProps {
  category?: string | null;
  className?: string;
}

/** Consistent outline icon for any category name (replaces emoji glyphs). */
export function CategoryIcon({ category, className = "h-4 w-4" }: CategoryIconProps) {
  const Icon = getCategoryIcon(category);
  return <Icon className={className} />;
}
