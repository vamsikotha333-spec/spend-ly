
-- Savings Goals table
CREATE TABLE public.savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  person TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read savings_goals" ON public.savings_goals FOR SELECT USING (true);
CREATE POLICY "Allow public insert savings_goals" ON public.savings_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update savings_goals" ON public.savings_goals FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete savings_goals" ON public.savings_goals FOR DELETE USING (true);

-- Budgets table
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  budget_amount NUMERIC NOT NULL,
  month DATE NOT NULL,
  person TEXT NOT NULL DEFAULT 'Central',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read budgets" ON public.budgets FOR SELECT USING (true);
CREATE POLICY "Allow public insert budgets" ON public.budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update budgets" ON public.budgets FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete budgets" ON public.budgets FOR DELETE USING (true);

-- Recurring Transactions table
CREATE TABLE public.recurring_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  transaction_type TEXT,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  added_by TEXT NOT NULL,
  applicable_to TEXT,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  next_run_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read recurring_transactions" ON public.recurring_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert recurring_transactions" ON public.recurring_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update recurring_transactions" ON public.recurring_transactions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete recurring_transactions" ON public.recurring_transactions FOR DELETE USING (true);

-- Update trigger for savings_goals
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
