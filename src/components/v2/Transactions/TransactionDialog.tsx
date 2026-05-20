import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, PiggyBank, Edit } from "lucide-react";
import { Transaction } from "@/types/transaction";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
}

export function TransactionDialog({ open, onOpenChange, transactions, onEdit }: TransactionDialogProps) {
  const getTypeIcon = (transaction: Transaction) => {
    const type = transaction.transaction_type || (transaction.type === "credit" ? "Income" : "Expense");
    switch (type) {
      case "Income":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "Savings":
        return <PiggyBank className="h-5 w-5 text-blue-600" />;
      default:
        return <TrendingDown className="h-5 w-5 text-red-600" />;
    }
  };

  const getTypeColor = (transaction: Transaction) => {
    const type = transaction.transaction_type || (transaction.type === "credit" ? "Income" : "Expense");
    switch (type) {
      case "Income":
        return "text-green-600 bg-green-50";
      case "Savings":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-red-600 bg-red-50";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>All Transactions</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const type = transaction.transaction_type || (transaction.type === "credit" ? "Income" : "Expense");
              const amountSign = type === "Income" ? "+" : type === "Savings" ? "" : "-";
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-lg", getTypeColor(transaction))}>
                      {getTypeIcon(transaction)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">{transaction.category}</p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.applicable_to || "Central"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-muted-foreground truncate">{transaction.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">{format(transaction.date, "MMM dd, yyyy")}</p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">by {transaction.addedBy}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className={cn(
                        "font-bold text-lg",
                        type === "Income" && "text-green-600",
                        type === "Savings" && "text-blue-600",
                        type === "Expense" && "text-red-600"
                      )}
                    >
                      {amountSign}₹{transaction.amount.toFixed(2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        onEdit(transaction);
                        onOpenChange(false);
                      }}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
