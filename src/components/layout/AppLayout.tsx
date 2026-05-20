import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { FilterProvider } from "@/contexts/FilterContext";
import { GlobalHeader } from "./GlobalHeader";

export function AppLayout() {
  return (
    <FilterProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <GlobalHeader />
            <main className="flex-1">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </FilterProvider>
  );
}
