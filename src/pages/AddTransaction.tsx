import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionFormV2 } from "@/components/v2/Transactions/TransactionFormV2";
import { Transaction } from "@/types/transaction";
import { toast } from "sonner";

export default function AddTransaction() {
  const { addTransaction } = useTransactions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as "Income" | "Expense" | "Savings") || undefined;
  const [resetKey, setResetKey] = useState(0);

  const handleAdd = async (transaction: Omit<Transaction, "id">, mode?: "another" | "list") => {
    try {
      await addTransaction(transaction);
      if (mode === "list") {
        toast.success("Transaction added successfully ✅");
        navigate("/transactions");
      } else {
        toast.success("Transaction added successfully ✅ — add another");
        setResetKey((k) => k + 1);
      }
    } catch {
      toast.error("Failed to add transaction");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <TransactionFormV2
          key={resetKey}
          onAddTransaction={handleAdd}
          initialType={initialType}
          showSaveOptions
        />
      </div>
    </div>
  );
}
