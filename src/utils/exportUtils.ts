import { Transaction } from "@/types/transaction";
import { format } from "date-fns";

export function exportTransactionsToCSV(transactions: Transaction[], month: Date) {
  const headers = ["Date", "Type", "Category", "Description", "Amount (₹)", "Added By", "Applicable To"];
  
  const csvRows = [headers.join(",")];
  
  transactions.forEach((transaction) => {
    const type = transaction.transaction_type || (transaction.type === "credit" ? "Income" : "Expense");
    const row = [
      format(transaction.date, "yyyy-MM-dd"),
      type,
      transaction.category,
      `"${transaction.description || ""}"`, // Wrap in quotes to handle commas
      transaction.amount.toFixed(2),
      transaction.addedBy,
      transaction.applicable_to || "Central",
    ];
    csvRows.push(row.join(","));
  });
  
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `transactions-${format(month, "MMM-yyyy")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
