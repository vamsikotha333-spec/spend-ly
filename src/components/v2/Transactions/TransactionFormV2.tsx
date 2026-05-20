import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Transaction } from "@/types/transaction";
import { CategoryCombobox } from "@/components/v2/Categories/CategoryCombobox";
import { useMembers } from "@/hooks/useMembers";
import { Link } from "react-router-dom";

interface TransactionFormV2Props {
  onAddTransaction: (transaction: Omit<Transaction, "id">, mode?: "another" | "list") => void;
  editTransaction?: Transaction;
  onCancelEdit?: () => void;
  initialType?: "Income" | "Expense" | "Savings";
  showSaveOptions?: boolean;
}

export function TransactionFormV2({ onAddTransaction, editTransaction, onCancelEdit, initialType, showSaveOptions }: TransactionFormV2Props) {
  const [transactionType, setTransactionType] = useState<"Income" | "Expense" | "Savings">(
    editTransaction?.transaction_type || initialType || "Expense"
  );
  const [amount, setAmount] = useState(editTransaction?.amount.toString() || "");
  const [category, setCategory] = useState(editTransaction?.category || "");
  const [description, setDescription] = useState(editTransaction?.description || "");
  const [date, setDate] = useState<Date>(editTransaction?.date ? new Date(editTransaction.date) : new Date());
  const [addedBy, setAddedBy] = useState(editTransaction?.addedBy || "");
  const [applicableTo, setApplicableTo] = useState(editTransaction?.applicable_to || "Central");
  

  const [saveMode, setSaveMode] = useState<"another" | "list">("another");

  // Sync form state when editTransaction changes
  useEffect(() => {
    if (editTransaction) {
      setTransactionType(editTransaction.transaction_type || (editTransaction.type === "credit" ? "Income" : "Expense"));
      setAmount(editTransaction.amount.toString());
      setCategory(editTransaction.category);
      setDescription(editTransaction.description || "");
      setDate(new Date(editTransaction.date));
      setAddedBy(editTransaction.addedBy);
      setApplicableTo(editTransaction.applicable_to || "Central");
    }
  }, [editTransaction]);

  const submitWithMode = (mode: "another" | "list") => {
    if (!amount || !category || !addedBy || !applicableTo) {
      toast.error("Please fill in all required fields");
      return;
    }

    const transaction: Omit<Transaction, "id"> = {
      type: transactionType === "Income" ? "credit" : "debit",
      transaction_type: transactionType,
      amount: parseFloat(amount),
      category,
      description,
      date,
      addedBy,
      applicable_to: applicableTo,
    };

    onAddTransaction(transaction, mode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitWithMode(saveMode);
  };

  

  return (
    <Card className="p-6 shadow-medium">
      <h2 className="text-xl font-bold mb-6">
        {editTransaction ? "Edit Transaction" : "Add Transaction"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={transactionType === "Income" ? "default" : "outline"}
            className={cn(
              "h-12",
              transactionType === "Income" && "bg-green-600 hover:bg-green-700 text-white"
            )}
            onClick={() => {
              setTransactionType("Income");
              setCategory("");
            }}
          >
            Income
          </Button>
          <Button
            type="button"
            variant={transactionType === "Expense" ? "default" : "outline"}
            className={cn(
              "h-12",
              transactionType === "Expense" && "bg-red-600 hover:bg-red-700 text-white"
            )}
            onClick={() => {
              setTransactionType("Expense");
              setCategory("");
            }}
          >
            Expense
          </Button>
          <Button
            type="button"
            variant={transactionType === "Savings" ? "default" : "outline"}
            className={cn(
              "h-12",
              transactionType === "Savings" && "bg-blue-600 hover:bg-blue-700 text-white"
            )}
            onClick={() => {
              setTransactionType("Savings");
              setCategory("");
            }}
          >
            Savings
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <CategoryCombobox
            type={transactionType}
            value={category}
            onChange={setCategory}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-12 text-lg"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Add a note..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-12"
            maxLength={200}
          />
        </div>

        <MemberSelects
          applicableTo={applicableTo}
          setApplicableTo={setApplicableTo}
          addedBy={addedBy}
          setAddedBy={setAddedBy}
        />

        {showSaveOptions && !editTransaction ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={() => { setSaveMode("another"); submitWithMode("another"); }}
              className="flex-1 h-12 bg-gradient-primary hover:opacity-90"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Save & Add Another
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setSaveMode("list"); submitWithMode("list"); }}
              className="flex-1 h-12"
            >
              Save & Go to Transactions
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 h-12 bg-gradient-primary hover:opacity-90">
              <PlusCircle className="mr-2 h-5 w-5" />
              {editTransaction ? "Update" : "Add"} Transaction
            </Button>
            {editTransaction && onCancelEdit && (
              <Button type="button" variant="outline" onClick={onCancelEdit} className="h-12">
                Cancel
              </Button>
            )}
          </div>
        )}
      </form>
    </Card>
  );
}

function MemberSelects({
  applicableTo,
  setApplicableTo,
  addedBy,
  setAddedBy,
}: {
  applicableTo: string;
  setApplicableTo: (v: string) => void;
  addedBy: string;
  setAddedBy: (v: string) => void;
}) {
  const { memberNames, isLoading } = useMembers();
  const empty = !isLoading && memberNames.length === 0;
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="applicableTo">Applicable To *</Label>
        <Select value={applicableTo} onValueChange={setApplicableTo} required>
          <SelectTrigger className="h-12">
            <SelectValue placeholder={empty ? "Add members first" : "Select"} />
          </SelectTrigger>
          <SelectContent>
            {memberNames.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="addedBy">Added By *</Label>
        <Select value={addedBy} onValueChange={setAddedBy} required>
          <SelectTrigger className="h-12">
            <SelectValue placeholder={empty ? "Add members first" : "Select"} />
          </SelectTrigger>
          <SelectContent>
            {memberNames.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {empty && (
          <p className="text-xs text-muted-foreground">
            No members yet —{" "}
            <Link to="/members" className="underline text-primary">add some</Link>{" "}
            to populate these dropdowns.
          </p>
        )}
      </div>
    </>
  );
}

