import { useEffect, useState } from "react";
import {
  Home, ArrowLeftRight, PlusCircle, Table2, BarChart3, ChevronDown,
  Sparkles, Wallet, Target, Repeat, PieChart, Tag, Users, LogOut, Landmark,
  TrendingUp, Layers, Flag, ShieldCheck, LineChart, Database, LayoutDashboard,
  type LucideIcon,
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
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppMode, AppMode } from "@/contexts/AppModeContext";

interface NavItem { title: string; icon: LucideIcon; path: string; }
interface NavSection { label: string; key: string; items: NavItem[]; }

/* ---------- FinTracker mode ---------- */
const finPrimary: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
];

const finSections: NavSection[] = [
  {
    label: "Finance",
    key: "finance",
    items: [
      { title: "Transactions", icon: ArrowLeftRight, path: "/transactions" },
      { title: "Add Transaction", icon: PlusCircle, path: "/add" },
      { title: "Budget vs Actual", icon: PieChart, path: "/budget" },
      { title: "Recurring", icon: Repeat, path: "/recurring" },
      { title: "Categories", icon: Tag, path: "/categories" },
    ],
  },
  {
    label: "Insights",
    key: "insights",
    items: [
      { title: "AI Insights", icon: Sparkles, path: "/insights" },
      { title: "Category Analytics", icon: Table2, path: "/spending" },
      { title: "Monthly Summary", icon: BarChart3, path: "/summary" },
      { title: "Savings Goals", icon: Target, path: "/goals" },
    ],
  },
  {
    label: "Family",
    key: "family",
    items: [
      { title: "Members", icon: Users, path: "/members" },
    ],
  },
];

/* ---------- Wealth mode ---------- */
const wealthPrimary: NavItem[] = [
  { title: "Wealth Dashboard", icon: Landmark, path: "/wealth" },
  { title: "Investments", icon: TrendingUp, path: "/wealth/investments" },
  { title: "Net Worth", icon: LineChart, path: "/wealth/net-worth" },
];

const wealthSections: NavSection[] = [
  {
    label: "Planning",
    key: "planning",
    items: [
      { title: "Asset Allocation", icon: Layers, path: "/wealth/allocation" },
      { title: "Financial Goals", icon: Flag, path: "/wealth/goals" },
      { title: "Insurance & Protection", icon: ShieldCheck, path: "/wealth/insurance" },
    ],
  },
  {
    label: "Settings",
    key: "wsettings",
    items: [{ title: "Master Data", icon: Database, path: "/settings/master-data" }],
  },
];

const SECTION_STORAGE_KEY = "fintracker:sidebar-sections";

function useSectionState(sections: NavSection[], activePath: string) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(SECTION_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Record<string, boolean>;
    } catch { /* ignore */ }
    return {};
  });

  // Auto-open the section containing the active route
  useEffect(() => {
    const match = sections.find((s) => s.items.some((i) => i.path === activePath));
    if (match && !open[match.key]) {
      setOpen((p) => ({ ...p, [match.key]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePath]);

  const toggle = (key: string) =>
    setOpen((p) => {
      const next = { ...p, [key]: !p[key] };
      try { localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });

  return { open, toggle };
}

function ModeSwitcher({ mode, onChange }: { mode: AppMode; onChange: (m: AppMode) => void }) {
  const options: { value: AppMode; label: string }[] = [
    { value: "fintracker", label: "FinTracker" },
    { value: "wealth", label: "Wealth" },
  ];
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-sidebar-accent/60 p-0.5 group-data-[collapsible=icon]:hidden">
      {options.map((o) => {
        const active = mode === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md px-2 py-1.5 text-[11.5px] font-semibold transition-colors",
              active
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const itemBase =
  "group/nav h-9 w-full justify-start gap-2.5 rounded-md px-2.5 text-[13.5px] font-medium transition-colors";
const itemActive =
  "bg-sidebar-accent text-foreground font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-primary";
const itemIdle = "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground";

function NavLinkItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <SidebarMenuItem className="relative">
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.title}
        className={cn(itemBase, active ? itemActive : itemIdle)}
      >
        <Link to={item.path} onClick={onClick}>
          <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover/nav:text-foreground")} />
          <span className="truncate">{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile, state } = useSidebar();
  const isMobile = useIsMobile();
  const { mode, setMode } = useAppMode();

  const primary = mode === "wealth" ? wealthPrimary : finPrimary;
  const sections = mode === "wealth" ? wealthSections : finSections;
  const { open, toggle } = useSectionState(sections, location.pathname);

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleModeChange = (m: AppMode) => {
    setMode(m);
    if (isMobile) setOpenMobile(false);
    const inWealth = location.pathname.startsWith("/wealth");
    if (m === "wealth" && !inWealth) navigate("/wealth");
    if (m === "fintracker" && inWealth) navigate("/");
  };

  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-3 space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-[18px] w-[18px] text-primary" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">FinTracker</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Pro</span>
          </div>
        </div>
        <ModeSwitcher mode={mode} onChange={handleModeChange} />
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {/* Priority navigation */}
        <SidebarGroup className="px-0 py-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {primary.map((item) => (
                <NavLinkItem
                  key={item.path}
                  item={item}
                  active={
                    location.pathname === item.path ||
                    (item.path === "/" && location.pathname === "/dashboard")
                  }
                  onClick={handleNavClick}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary, collapsible sections */}
        {sections.map((section) => {
          const isOpen = collapsed ? true : !!open[section.key];
          return (
            <SidebarGroup key={section.key} className="px-0 pt-2 pb-0">
              <Collapsible open={isOpen} onOpenChange={() => !collapsed && toggle(section.key)}>
                <CollapsibleTrigger
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 transition-colors hover:text-foreground",
                    "group-data-[collapsible=icon]:hidden",
                  )}
                >
                  {section.label}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen ? "rotate-0" : "-rotate-90")} />
                </CollapsibleTrigger>
                <CollapsibleContent forceMount={collapsed ? true : undefined} className={collapsed ? "" : undefined}>
                  <SidebarGroupContent className={cn(!isOpen && !collapsed && "hidden")}>
                    <SidebarMenu className="mt-0.5 gap-0.5">
                      {section.items.map((item) => (
                        <NavLinkItem
                          key={item.path}
                          item={item}
                          active={location.pathname === item.path}
                          onClick={handleNavClick}
                        />
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 px-2.5 text-[13px] text-muted-foreground hover:text-foreground"
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Signed out");
          }}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
        </Button>
      </div>
    </Sidebar>
  );
}
