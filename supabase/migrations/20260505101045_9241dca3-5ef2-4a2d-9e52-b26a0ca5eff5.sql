
-- TRANSACTIONS
DROP POLICY IF EXISTS "Allow public read access" ON public.transactions;
DROP POLICY IF EXISTS "Allow public insert access" ON public.transactions;
DROP POLICY IF EXISTS "Allow public update access" ON public.transactions;
DROP POLICY IF EXISTS "Allow public delete access" ON public.transactions;

CREATE POLICY "Authenticated can read transactions" ON public.transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update transactions" ON public.transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete transactions" ON public.transactions FOR DELETE TO authenticated USING (true);

-- BUDGETS
DROP POLICY IF EXISTS "Allow public read budgets" ON public.budgets;
DROP POLICY IF EXISTS "Allow public insert budgets" ON public.budgets;
DROP POLICY IF EXISTS "Allow public update budgets" ON public.budgets;
DROP POLICY IF EXISTS "Allow public delete budgets" ON public.budgets;

CREATE POLICY "Authenticated can read budgets" ON public.budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert budgets" ON public.budgets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update budgets" ON public.budgets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete budgets" ON public.budgets FOR DELETE TO authenticated USING (true);

-- RECURRING TRANSACTIONS
DROP POLICY IF EXISTS "Allow public read recurring_transactions" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Allow public insert recurring_transactions" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Allow public update recurring_transactions" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Allow public delete recurring_transactions" ON public.recurring_transactions;

CREATE POLICY "Authenticated can read recurring_transactions" ON public.recurring_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert recurring_transactions" ON public.recurring_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update recurring_transactions" ON public.recurring_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete recurring_transactions" ON public.recurring_transactions FOR DELETE TO authenticated USING (true);

-- SAVINGS GOALS
DROP POLICY IF EXISTS "Allow public read savings_goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Allow public insert savings_goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Allow public update savings_goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Allow public delete savings_goals" ON public.savings_goals;

CREATE POLICY "Authenticated can read savings_goals" ON public.savings_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert savings_goals" ON public.savings_goals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update savings_goals" ON public.savings_goals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete savings_goals" ON public.savings_goals FOR DELETE TO authenticated USING (true);

-- CATEGORIES
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public update categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public delete categories" ON public.categories;

CREATE POLICY "Authenticated can read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update categories" ON public.categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete categories" ON public.categories FOR DELETE TO authenticated USING (true);
