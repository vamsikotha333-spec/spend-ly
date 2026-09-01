import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Flag, ShieldCheck, Wallet, TrendingDown, Zap } from "lucide-react";

interface Props {
  onAddAsset: () => void;
  onAddLiability: () => void;
}

export function WealthQuickActions({ onAddAsset, onAddLiability }: Props) {
  const actions = [
    { icon: LineChart, label: "Investment", to: "/wealth/investments" },
    { icon: Flag, label: "Goal", to: "/wealth/goals" },
    { icon: ShieldCheck, label: "Policy", to: "/wealth/insurance" },
    { icon: Wallet, label: "Asset", onClick: onAddAsset },
    { icon: TrendingDown, label: "Liability", onClick: onAddLiability },
  ];

  return (
    <Card className="p-4 md:p-5 border shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-primary" />
        <h2 className="text-base font-bold">Quick Actions</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          const inner = (
            <Button
              variant="outline"
              className="w-full h-auto py-3 flex-col gap-1.5 hover:bg-primary/5 hover:border-primary/40 hover:text-primary"
              onClick={"onClick" in a ? a.onClick : undefined}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">+ {a.label}</span>
            </Button>
          );
          return "to" in a && a.to ? (
            <Link key={a.label} to={a.to}>{inner}</Link>
          ) : (
            <div key={a.label}>{inner}</div>
          );
        })}
      </div>
    </Card>
  );
}
