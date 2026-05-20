-- =========================================================
-- Full schema bootstrap for fresh Lovable Cloud project
-- =========================================================

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ----- transactions -----
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('credit','debit')),
  transaction_type text,
  amount numeric(12,2) NOT NULL,
  category text NOT NULL,
  description text,
  date timestamptz NOT NULL,
  added_by text NOT NULL,
  applicable_to text,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ----- budgets -----
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  budget_amount numeric NOT NULL,
  month date NOT NULL,
  person text NOT NULL DEFAULT 'Central',
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- ----- savings_goals -----
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  deadline date,
  person text NOT NULL,
  category text,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON public.savings_goals;
CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----- recurring_transactions -----
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  transaction_type text,
  amount numeric NOT NULL,
  category text NOT NULL,
  description text,
  added_by text NOT NULL,
  applicable_to text,
  frequency text NOT NULL DEFAULT 'monthly',
  next_run_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

-- ----- categories -----
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('Income','Expense','Savings')),
  emoji text,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_type_name_unique
  ON public.categories (user_id, type, lower(name));

-- ----- category_templates (shared, read-only) -----
CREATE TABLE IF NOT EXISTS public.category_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('Income','Expense','Savings')),
  emoji text,
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS category_templates_type_name_uniq
  ON public.category_templates (type, lower(name));
ALTER TABLE public.category_templates ENABLE ROW LEVEL SECURITY;

-- ----- members (per-user) -----
CREATE TABLE IF NOT EXISTS public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS members_user_name_uniq
  ON public.members (user_id, lower(name));
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- RLS Policies (own-row for everything; templates read-only)
-- =========================================================

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN ('transactions','budgets','savings_goals','recurring_transactions','categories','category_templates','members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- transactions
CREATE POLICY "own select" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own update" ON public.transactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own delete" ON public.transactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- budgets
CREATE POLICY "own select" ON public.budgets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own insert" ON public.budgets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own update" ON public.budgets FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own delete" ON public.budgets FOR DELETE TO authenticated USING (user_id = auth.uid());

-- savings_goals
CREATE POLICY "own select" ON public.savings_goals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own insert" ON public.savings_goals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own update" ON public.savings_goals FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own delete" ON public.savings_goals FOR DELETE TO authenticated USING (user_id = auth.uid());

-- recurring_transactions
CREATE POLICY "own select" ON public.recurring_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own insert" ON public.recurring_transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own update" ON public.recurring_transactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own delete" ON public.recurring_transactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- categories
CREATE POLICY "own select" ON public.categories FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own update" ON public.categories FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own delete" ON public.categories FOR DELETE TO authenticated USING (user_id = auth.uid());

-- category_templates (read-only for authenticated)
CREATE POLICY "read templates" ON public.category_templates FOR SELECT TO authenticated USING (true);

-- members
CREATE POLICY "own select" ON public.members FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own insert" ON public.members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own update" ON public.members FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own delete" ON public.members FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- =========================================================
-- Seed category_templates
-- =========================================================
INSERT INTO public.category_templates (name, type, emoji) VALUES
  ('Salary','Income','💰'),
  ('Freelance','Income','💻'),
  ('Investment','Income','📈'),
  ('Gift','Income','🎁'),
  ('Other Income','Income','💵')
ON CONFLICT DO NOTHING;

INSERT INTO public.category_templates (name, type, emoji) VALUES
  ('Rent & Maintenance','Expense','🏠'),
  ('Groceries','Expense','🛒'),
  ('Vegetables & Fruits','Expense','🥦'),
  ('Entertainment (Movies, Trip Etc.)','Expense','🎬'),
  ('Dry Fruits & Nuts','Expense','🥜'),
  ('Gas Bill','Expense','🔥'),
  ('Power Bill','Expense','⚡'),
  ('Wifi Bill','Expense','📶'),
  ('Recharge Bill','Expense','📱'),
  ('Health & Medical Bills','Expense','🏥'),
  ('Water Can','Expense','💧'),
  ('Dietician','Expense','🥗'),
  ('Dining (Breakfast, Lunch, Dinner, Snacks)','Expense','🍽️'),
  ('Shopping (Clothes, Shoes Etc.)','Expense','🛍️'),
  ('Home Appliances (Grinder, Pipes Etc.)','Expense','🏡'),
  ('Donation','Expense','🙏'),
  ('Travel (Bus, Train Etc.)','Expense','🚆'),
  ('Personal Care (Salon, Facials Etc.)','Expense','💇'),
  ('Subscriptions','Expense','📺'),
  ('Transportation (Bike, Auto Etc.)','Expense','🏍️'),
  ('Miscellaneous','Expense','📦'),
  ('Milk','Expense','🥛'),
  ('LIC','Expense','📋'),
  ('Petrol','Expense','⛽'),
  ('Eggs','Expense','🥚'),
  ('Cooking Maid','Expense','👩‍🍳'),
  ('Diet Food','Expense','🥗'),
  ('Health Insurance','Expense','🏥')
ON CONFLICT DO NOTHING;

INSERT INTO public.category_templates (name, type, emoji) VALUES
  ('Emergency Fund','Savings','🆘'),
  ('Investment','Savings','📊'),
  ('FD','Savings','🏦'),
  ('PPF','Savings','🏛️'),
  ('Chitti Amount','Savings','💰'),
  ('LIC','Savings','📋'),
  ('Other Savings','Savings','💎')
ON CONFLICT DO NOTHING;

-- =========================================================
-- Trigger: on signup, copy template categories for new user
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_seed_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (name, type, emoji, user_id)
  SELECT t.name, t.type, t.emoji, NEW.id
  FROM public.category_templates t
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_seed_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_seed_categories
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_seed_categories();

-- =========================================================
-- Realtime
-- =========================================================
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.categories';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.members';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
