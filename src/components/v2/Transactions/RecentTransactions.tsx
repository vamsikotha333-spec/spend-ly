import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Edit, Eye, ClipboardList } from "lucide-react";
import { Transaction } from "@/types/transaction";
import { cn } from "@/lib/utils";
import { CategoryIcon, categoryLabel } from "@/utils/categoryIcon";

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll: () => void;
  onEdit: (transaction: Transaction) => void;
}

export function RecentTransactions({ transactions, onViewAll, onEdit }: RecentTransactionsProps) {
  const recentTransactions = transactions.slice(0, 5);

  return (
    <Card className="p-6 border animate-fade-in" style={{ animationDelay: "350ms", animationFillMode: "both" }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><ClipboardList className="h-4 w-4" /> Recent Transactions</h3>
        <Button variant="outline" size="sm" onClick={onViewAll}>
          <Eye className="mr-2 h-4 w-4" />
          View All
        </Button>
      </div>

      <div className="space-y-2">
        {recentTransactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No transactions found</p>
        ) : (
          recentTransactions.map((transaction, index) => {
            const type = transaction.transaction_type || (transaction.type === "credit" ? "Income" : "Expense");
            const amountSign = type === "Income" ? "+" : type === "Savings" ? "" : "-";
            
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-xl border hover:bg-secondary/50 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${400 + index * 60}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <CategoryIcon category={transaction.category} className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate text-sm">{categoryLabel(transaction.category)}</p>
                      <Badge variant="outline" className="text-[10px] h-5 rounded-md">
                        {transaction.applicable_to || "Central"}
                      </Badge>
                    </div>
                    {transaction.description && (
                      <p className="text-xs text-muted-foreground truncate">{transaction.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-muted-foreground">{format(transaction.date, "MMM dd, yyyy")}</p>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <p className="text-[10px] text-muted-foreground">by {transaction.addedBy}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={cn(
                    "font-bold text-sm tabular-nums",
                    type === "Income" && "text-success",
                    type === "Savings" && "text-info",
                    type === "Expense" && "text-destructive"
                  )}>
                    {amountSign}₹{transaction.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(transaction)} className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
