import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Illustration = "goals" | "recurring" | "transactions" | "generic";

function Art({ kind }: { kind: Illustration }) {
  if (kind === "goals") {
    return (
      <svg viewBox="0 0 220 160" className="w-48 h-36 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--info))" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <ellipse cx="110" cy="140" rx="80" ry="8" fill="hsl(var(--muted))" opacity="0.5" />
        <circle cx="110" cy="80" r="55" fill="url(#g1)" />
        <circle cx="110" cy="80" r="55" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="6 8" opacity="0.5" />
        <circle cx="110" cy="80" r="32" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
        <circle cx="110" cy="80" r="14" fill="hsl(var(--destructive))" />
        <circle cx="110" cy="80" r="5" fill="hsl(var(--card))" />
        <path d="M30 80 L80 80" stroke="hsl(var(--accent))" strokeWidth="3" strokeLinecap="round" />
        <polygon points="78,75 88,80 78,85" fill="hsl(var(--accent))" />
      </svg>
    );
  }
  if (kind === "recurring") {
    return (
      <svg viewBox="0 0 220 160" className="w-48 h-36 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--info))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <ellipse cx="110" cy="140" rx="80" ry="8" fill="hsl(var(--muted))" opacity="0.5" />
        <rect x="55" y="35" width="110" height="90" rx="10" fill="url(#g2)" stroke="hsl(var(--primary))" strokeWidth="2" />
        <rect x="55" y="35" width="110" height="22" rx="10" fill="hsl(var(--primary))" opacity="0.85" />
        <circle cx="75" cy="46" r="3" fill="hsl(var(--card))" />
        <circle cx="145" cy="46" r="3" fill="hsl(var(--card))" />
        <line x1="70" y1="75" x2="150" y2="75" stroke="hsl(var(--border))" strokeWidth="2" />
        <line x1="70" y1="90" x2="130" y2="90" stroke="hsl(var(--border))" strokeWidth="2" />
        <circle cx="155" cy="105" r="14" fill="hsl(var(--success))" />
        <path d="M150 105 a5 5 0 1 0 5 -5" stroke="hsl(var(--card))" strokeWidth="2" fill="none" strokeLinecap="round" />
        <polygon points="155,97 158,101 152,101" fill="hsl(var(--card))" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 220 160" className="w-48 h-36 mx-auto" fill="none" aria-hidden="true">
      <ellipse cx="110" cy="140" rx="80" ry="8" fill="hsl(var(--muted))" opacity="0.5" />
      <rect x="60" y="40" width="100" height="80" rx="8" fill="hsl(var(--muted))" opacity="0.6" />
      <line x1="75" y1="65" x2="145" y2="65" stroke="hsl(var(--border))" strokeWidth="3" />
      <line x1="75" y1="85" x2="125" y2="85" stroke="hsl(var(--border))" strokeWidth="3" />
      <line x1="75" y1="105" x2="135" y2="105" stroke="hsl(var(--border))" strokeWidth="3" />
    </svg>
  );
}

interface EmptyStateProps {
  illustration?: Illustration;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ illustration = "generic", title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <Card className={cn("p-10 text-center shadow-soft animate-fade-in", className)}>
      <div className="mb-4">
        <Art kind={illustration} />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-5 hover-lift" onClick={onAction}>
          <PlusCircle className="h-4 w-4 mr-1" /> {actionLabel}
        </Button>
      )}
    </Card>
  );
}
