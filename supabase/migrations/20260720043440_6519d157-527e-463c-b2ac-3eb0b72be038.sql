
-- Master Data Management: single table with typed kinds
CREATE TABLE public.master_data_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN (
    'investment_type','investment_purpose','bank_name','interest_type',
    'asset_type','liability_type','tag'
  )),
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_data_items TO authenticated;
GRANT ALL ON public.master_data_items TO service_role;

ALTER TABLE public.master_data_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own master data select" ON public.master_data_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own master data insert" ON public.master_data_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own master data update" ON public.master_data_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own master data delete" ON public.master_data_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_master_data_items_updated_at
BEFORE UPDATE ON public.master_data_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults for new users
CREATE OR REPLACE FUNCTION public.seed_master_data_for_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.master_data_items (user_id, kind, name, is_default, sort_order)
  VALUES
    -- Investment Types
    (_user_id,'investment_type','Stocks',true,1),
    (_user_id,'investment_type','Mutual Fund',true,2),
    (_user_id,'investment_type','Gold',true,3),
    (_user_id,'investment_type','Fixed Deposit',true,4),
    (_user_id,'investment_type','Bank Savings',true,5),
    (_user_id,'investment_type','Interest Turnover',true,6),
    (_user_id,'investment_type','Chit Fund',true,7),
    (_user_id,'investment_type','PPF',true,8),
    (_user_id,'investment_type','EPF',true,9),
    (_user_id,'investment_type','Bonds',true,10),
    (_user_id,'investment_type','Crypto',true,11),
    (_user_id,'investment_type','Real Estate',true,12),
    (_user_id,'investment_type','Other',true,99),
    -- Investment Purposes
    (_user_id,'investment_purpose','Immediate Use Fund',true,1),
    (_user_id,'investment_purpose','Emergency Fund',true,2),
    (_user_id,'investment_purpose','Short-Term Fund',true,3),
    (_user_id,'investment_purpose','Long-Term Fund',true,4),
    (_user_id,'investment_purpose','Retirement',true,5),
    (_user_id,'investment_purpose','Child Education',true,6),
    (_user_id,'investment_purpose','House',true,7),
    (_user_id,'investment_purpose','Car',true,8),
    (_user_id,'investment_purpose','Vacation',true,9),
    (_user_id,'investment_purpose','Business',true,10),
    (_user_id,'investment_purpose','Tax Saving',true,11),
    (_user_id,'investment_purpose','Passive Income',true,12),
    (_user_id,'investment_purpose','Other',true,99),
    -- Interest Types
    (_user_id,'interest_type','Simple Interest',true,1),
    (_user_id,'interest_type','Compound Interest',true,2),
    -- Bank Names (a few common defaults)
    (_user_id,'bank_name','HDFC Bank',true,1),
    (_user_id,'bank_name','ICICI Bank',true,2),
    (_user_id,'bank_name','SBI',true,3),
    (_user_id,'bank_name','Axis Bank',true,4),
    (_user_id,'bank_name','Kotak Mahindra',true,5),
    -- Asset Types
    (_user_id,'asset_type','Cash',true,1),
    (_user_id,'asset_type','Bank Account',true,2),
    (_user_id,'asset_type','Real Estate',true,3),
    (_user_id,'asset_type','Vehicle',true,4),
    (_user_id,'asset_type','Gold',true,5),
    (_user_id,'asset_type','Other',true,99),
    -- Liability Types
    (_user_id,'liability_type','Home Loan',true,1),
    (_user_id,'liability_type','Car Loan',true,2),
    (_user_id,'liability_type','Personal Loan',true,3),
    (_user_id,'liability_type','Credit Card',true,4),
    (_user_id,'liability_type','Education Loan',true,5),
    (_user_id,'liability_type','Other',true,99),
    -- Tags
    (_user_id,'tag','Monthly Income',true,1),
    (_user_id,'tag','SIP',true,2),
    (_user_id,'tag','Dividend',true,3),
    (_user_id,'tag','Family',true,4),
    (_user_id,'tag','High Risk',true,5),
    (_user_id,'tag','Low Risk',true,6),
    (_user_id,'tag','Liquid',true,7),
    (_user_id,'tag','Tax Saver',true,8)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Trigger to seed for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user_seed_master_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_master_data_for_user(NEW.id);
  RETURN NEW;
END;
$$;

-- Backfill defaults for all existing users (safe: ON CONFLICT DO NOTHING)
DO $$
DECLARE u record;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    PERFORM public.seed_master_data_for_user(u.id);
  END LOOP;
END $$;

-- Extend investments table with new fields (nullable/safe defaults)
ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  -- Interest turnover fields
  ADD COLUMN IF NOT EXISTS principal_amount numeric,
  ADD COLUMN IF NOT EXISTS borrower_name text,
  ADD COLUMN IF NOT EXISTS interest_rate numeric,
  ADD COLUMN IF NOT EXISTS interest_type text,
  ADD COLUMN IF NOT EXISTS interest_frequency text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS interest_received numeric NOT NULL DEFAULT 0,
  -- Free-form type text so custom investment types work (existing 'category' stays for backward-compat)
  ADD COLUMN IF NOT EXISTS type_name text;

-- Backfill type_name from existing category enum-like values for display
UPDATE public.investments
SET type_name = COALESCE(type_name,
  CASE category
    WHEN 'stocks' THEN 'Stocks'
    WHEN 'mutual_funds' THEN 'Mutual Fund'
    WHEN 'fixed_deposits' THEN 'Fixed Deposit'
    WHEN 'gold' THEN 'Gold'
    WHEN 'ppf' THEN 'PPF'
    WHEN 'epf' THEN 'EPF'
    WHEN 'bonds' THEN 'Bonds'
    WHEN 'real_estate' THEN 'Real Estate'
    ELSE 'Other'
  END)
WHERE type_name IS NULL;
