import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Phase 1 stub — header bell with empty inbox.
 * Phase 5 wires real notifications (budget exceeded, salary received, etc.) into this same surface.
 */
export function NotificationsBell() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground relative"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-0 rounded-xl shadow-soft">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-bold text-foreground">Notifications</p>
          <p className="text-[11px] text-muted-foreground">Smart alerts about your money</p>
        </div>
        <div className="p-6 text-center">
          <span className="text-3xl block mb-2">🔔</span>
          <p className="text-xs font-semibold text-foreground">You're all caught up</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            We'll alert you about budgets, large transactions and goal milestones.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
