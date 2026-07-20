import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Home from "./pages/Home";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import SpendingByCategory from "./pages/SpendingByCategory";
import MonthlySummary from "./pages/MonthlySummary";
import Insights from "./pages/Insights";
import SavingsGoals from "./pages/SavingsGoals";
import BudgetVsActual from "./pages/BudgetVsActual";
import RecurringTransactions from "./pages/RecurringTransactions";
import ManageCategories from "./pages/ManageCategories";
import ManageMembers from "./pages/ManageMembers";
import Wealth from "./pages/Wealth";
import Investments from "./pages/wealth/Investments";
import NetWorthPage from "./pages/wealth/NetWorth";
import AssetAllocation from "./pages/wealth/AssetAllocation";
import FinancialGoals from "./pages/wealth/FinancialGoals";
import Insurance from "./pages/wealth/Insurance";
import MasterData from "./pages/settings/MasterData";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="add" element={<AddTransaction />} />
            <Route path="spending" element={<SpendingByCategory />} />
            <Route path="summary" element={<MonthlySummary />} />
            <Route path="budget" element={<BudgetVsActual />} />
            <Route path="goals" element={<SavingsGoals />} />
            <Route path="recurring" element={<RecurringTransactions />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="members" element={<ManageMembers />} />
            <Route path="wealth" element={<Wealth />} />
            <Route path="wealth/investments" element={<Investments />} />
            <Route path="wealth/net-worth" element={<NetWorthPage />} />
            <Route path="wealth/allocation" element={<AssetAllocation />} />
            <Route path="wealth/goals" element={<FinancialGoals />} />
            <Route path="wealth/insurance" element={<Insurance />} />
            <Route path="insights" element={<Insights />} />
            <Route path="settings/master-data" element={<MasterData />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
