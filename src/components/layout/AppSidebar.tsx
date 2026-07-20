import {
  Home, ArrowLeftRight, PlusCircle, Table2, BarChart3,
  Sparkles, Wallet, Target, Repeat, PieChart, Tag, Users, LogOut, Landmark,
  TrendingUp, Layers, Flag, ShieldCheck, LineChart, Database, type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppMode, AppMode } from "@/contexts/AppModeContext";

interface NavItem { title: string; icon: LucideIcon; path: string; }
interface NavGroup { label: string; items: NavItem[]; }

const finTrackerGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Home", icon: Home, path: "/" },
      { title: "Monthly Summary", icon: BarChart3, path: "/summary" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "Category Analytics", icon: Table2, path: "/spending" },
      { title: "Savings Goals", icon: Target, path: "/goals" },
      { title: "Budget vs Actual", icon: PieChart, path: "/budget" },
    ],
  },
  {
    label: "AI Advisor",
    items: [
      { title: "AI Insights", icon: Sparkles, path: "/insights" },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Transactions", icon: ArrowLeftRight, path: "/transactions" },
      { title: "Add Transaction", icon: PlusCircle, path: "/add" },
      { title: "Recurring", icon: Repeat, path: "/recurring" },
      { title: "Categories", icon: Tag, path: "/categories" },
      { title: "Members", icon: Users, path: "/members" },
    ],
  },
];

const wealthGroups: NavGroup[] = [
  {
    label: "Wealth",
    items: [
      { title: "Wealth Dashboard", icon: Landmark, path: "/wealth" },
      { title: "Investments", icon: TrendingUp, path: "/wealth/investments" },
      { title: "Net Worth", icon: LineChart, path: "/wealth/net-worth" },
      { title: "Asset Allocation", icon: Layers, path: "/wealth/allocation" },
      { title: "Financial Goals", icon: Flag, path: "/wealth/goals" },
      { title: "Insurance & Protection", icon: ShieldCheck, path: "/wealth/insurance" },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Master Data", icon: Database, path: "/settings/master-data" },
    ],
  },
];

function ModeSwitcher({ mode, onChange }: { mode: AppMode; onChange: (m: AppMode) => void }) {
  const options: { value: AppMode; label: string; emoji: string }[] = [
    { value: "fintracker", label: "FinTracker", emoji: "💰" },
    { value: "wealth", label: "Wealth Tracker", emoji: "📈" },
  ];
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary/60 p-1">
      {options.map((o) => {
        const active = mode === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold transition-all",
              active
                ? "bg-gradient-primary text-primary-foreground shadow-[0_4px_14px_-4px_hsla(217,91%,60%,0.55)]"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={active}
          >
            <span>{o.emoji}</span>
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const { mode, setMode } = useAppMode();

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleModeChange = (m: AppMode) => {
    setMode(m);
    if (isMobile) setOpenMobile(false);
    // If current path doesn't belong to target mode, navigate to its home
    const inWealth = location.pathname.startsWith("/wealth");
    if (m === "wealth" && !inWealth) navigate("/wealth");
    if (m === "fintracker" && inWealth) navigate("/");
  };

  const navGroups = mode === "wealth" ? wealthGroups : finTrackerGroups;

  return (
    <Sidebar
      className="border-r border-sidebar-border"
      style={{
        background:
          "linear-gradient(180deg, hsl(var(--sidebar-background)) 0%, hsl(210 40% 98%) 100%)",
      }}
    >
      <SidebarHeader className="border-b border-sidebar-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-soft ring-1 ring-primary/20">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-sidebar-foreground">FinTracker</span>
            <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">Pro</span>
          </div>
        </div>
        <ModeSwitcher mode={mode} onChange={handleModeChange} />
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        {navGroups.map((group, gIdx) => (
          <SidebarGroup key={group.label} className={cn("px-0", gIdx > 0 && "mt-1")}>
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 mb-0.5">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-px">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          "group/nav w-full justify-start gap-2.5 h-9 px-2.5 text-[13.5px] rounded-lg transition-all duration-200 ease-out",
                          isActive
                            ? "bg-gradient-primary text-primary-foreground font-semibold shadow-[0_4px_14px_-4px_hsla(217,91%,60%,0.55)] hover:bg-gradient-primary"
                            : "text-[#64748B] dark:text-muted-foreground font-medium hover:bg-secondary/70 hover:text-sidebar-foreground"
                        )}
                      >
                        <Link to={item.path} onClick={handleNavClick}>
                          <Icon
                            className={cn(
                              "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                              isActive
                                ? "text-primary-foreground"
                                : "text-[#64748B] dark:text-muted-foreground group-hover/nav:text-primary"
                            )}
                          />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-[13px] text-muted-foreground hover:text-foreground"
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Signed out");
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </Sidebar>
  );
}
