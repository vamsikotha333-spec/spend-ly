import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { FilterProvider } from "@/contexts/FilterContext";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { GlobalHeader } from "./GlobalHeader";
import { FloatingAddButton } from "./FloatingAddButton";
import { PageTransition } from "./PageTransition";

export function AppLayout() {
  return (
    <AppModeProvider>
    <FilterProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <GlobalHeader />
            <main className="flex-1">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </main>
          </div>
          <FloatingAddButton />
        </div>
      </SidebarProvider>
    </FilterProvider>
  );
}
