import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface PageSkeletonProps {
  rows?: number;
  showStats?: boolean;
}

export function PageSkeleton({ rows = 5, showStats = true }: PageSkeletonProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="p-5 border-0 shadow-soft">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-32 mb-2" />
                <Skeleton className="h-2 w-full" />
              </Card>
            ))}
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Card key={i} className="p-4 border-0 shadow-soft">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
