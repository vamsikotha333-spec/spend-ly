ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS member TEXT;
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS member TEXT;

CREATE TABLE IF NOT EXISTS public.net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assets_total NUMERIC NOT NULL DEFAULT 0,
  liabilities_total NUMERIC NOT NULL DEFAULT 0,
  net_worth NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, snapshot_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.net_worth_snapshots TO authenticated;
GRANT ALL ON public.net_worth_snapshots TO service_role;

ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own net worth snapshots select" ON public.net_worth_snapshots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own net worth snapshots insert" ON public.net_worth_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own net worth snapshots update" ON public.net_worth_snapshots FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own net worth snapshots delete" ON public.net_worth_snapshots FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_net_worth_snapshots_updated_at BEFORE UPDATE ON public.net_worth_snapshots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();