import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface ComingSoonProps {
  feature: string;
  description?: string;
}

export function ComingSoon({ feature, description }: ComingSoonProps) {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <Card className="p-10 md:p-16 text-center border-dashed">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-soft">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {feature} — Coming Soon
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          {description ??
            "This part of Wealth Tracker is on the way. We're building it carefully so it fits naturally with your existing data."}
        </p>
      </Card>
    </div>
  );
}

export default ComingSoon;
