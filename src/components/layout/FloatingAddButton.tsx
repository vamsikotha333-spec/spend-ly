import { Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const HIDDEN_ROUTES = ["/add", "/auth", "/reset-password"];

export function FloatingAddButton() {
  const navigate = useNavigate();
  const location = useLocation();
  if (HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r))) return null;

  return (
    <button
      onClick={() => navigate("/add")}
      className={cn(
        "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full",
        "bg-gradient-primary text-primary-foreground shadow-large",
        "flex items-center justify-center",
        "transition-all duration-200 hover:scale-110 active:scale-95",
        "hover:shadow-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
      aria-label="Add transaction"
      title="Add transaction"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}
