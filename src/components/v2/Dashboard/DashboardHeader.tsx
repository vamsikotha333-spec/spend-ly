import { Wallet, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface DashboardHeaderProps {
  selectedMonth: Date | null;
  onMonthChange: (month: Date | null) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  availableMonths: Date[];
}

export function DashboardHeader({
  selectedMonth,
  onMonthChange,
  searchTerm,
  onSearchChange,
  availableMonths,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-gradient-primary py-8 px-4 shadow-large">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Wallet className="h-8 w-8 text-white" />
          <h1 className="text-3xl font-bold text-white">FinTracker</h1>
          <span className="text-white/80 text-sm ml-2">v2</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
          
          <Select
            value={selectedMonth ? format(selectedMonth, "yyyy-MM") : "all"}
            onValueChange={(value) => {
              if (value === "all") {
                onMonthChange(null);
              } else {
                const [year, month] = value.split("-");
                onMonthChange(new Date(parseInt(year), parseInt(month) - 1, 1));
              }
            }}
          >
            <SelectTrigger className="h-12 bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {availableMonths.map((month) => (
                <SelectItem key={month.toISOString()} value={format(month, "yyyy-MM")}>
                  {format(month, "MMMM yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
