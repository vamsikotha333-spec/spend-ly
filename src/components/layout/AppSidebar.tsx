import {
  Home, ArrowLeftRight, PlusCircle, Table2, BarChart3,
  Sparkles, Wallet, Target, Repeat, PieChart, Tag, Users, LogOut, type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useLocation } from "react-router-dom";
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

interface NavItem {
  title: string;
  icon: LucideIcon;
  path: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Home", icon: Home, path: "/" },
    ],
  },
  {
    label: "Finance",
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
    items: [
      { title: "AI Insights", icon: Sparkles, path: "/insights" },
      { title: "Category Analytics", icon: Table2, path: "/spending" },
      { title: "Monthly Summary", icon: BarChart3, path: "/summary" },
      { title: "Savings Goals", icon: Target, path: "/goals" },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      className="border-r border-sidebar-border"
      style={{
        background:
          "linear-gradient(180deg, hsl(var(--sidebar-background)) 0%, hsl(210 40% 98%) 100%)",
      }}
    >
      <SidebarHeader className="border-b border-sidebar-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-soft ring-1 ring-primary/20">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-sidebar-foreground">FinTracker</span>
            <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">Pro</span>
          </div>
        </div>
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
