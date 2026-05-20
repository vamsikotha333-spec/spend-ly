
-- Add user_id to all data tables, backfill to vamsi's account, enforce per-user RLS

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.recurring_transactions ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id uuid;

UPDATE public.transactions SET user_id = '969c5b5e-a312-43c5-813f-5cfb86393d01' WHERE user_id IS NULL;
UPDATE public.budgets SET user_id = '969c5b5e-a312-43c5-813f-5cfb86393d01' WHERE user_id IS NULL;
UPDATE public.recurring_transactions SET user_id = '969c5b5e-a312-43c5-813f-5cfb86393d01' WHERE user_id IS NULL;
UPDATE public.savings_goals SET user_id = '969c5b5e-a312-43c5-813f-5cfb86393d01' WHERE user_id IS NULL;
UPDATE public.categories SET user_id = '969c5b5e-a312-43c5-813f-5cfb86393d01' WHERE user_id IS NULL;

ALTER TABLE public.transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.budgets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.recurring_transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.savings_goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.transactions ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.budgets ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.recurring_transactions ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.savings_goals ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.categories ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Drop old permissive policies and replace with user-scoped ones
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN ('transactions','budgets','recurring_transactions','savings_goals','categories')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Recreate per-user policies
CREATE POLICY "own select" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own update" ON public.transactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own delete" ON public.transactions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "own select" ON public.budgets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own insert" ON public.budgets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own update" ON public.budgets FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own delete" ON public.budgets FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "own select" ON public.recurring_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own insert" ON public.recurring_transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own update" ON public.recurring_transactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own delete" ON public.recurring_transactions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "own select" ON public.savings_goals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own insert" ON public.savings_goals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own update" ON public.savings_goals FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own delete" ON public.savings_goals FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "own select" ON public.categories FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own update" ON public.categories FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own delete" ON public.categories FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
