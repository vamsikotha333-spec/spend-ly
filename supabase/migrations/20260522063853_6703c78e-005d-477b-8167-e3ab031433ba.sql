CREATE TABLE IF NOT EXISTS public.savings_contributions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  amount numeric NOT NULL,
  note text,
  contributed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal ON public.savings_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_savings_contributions_user ON public.savings_contributions(user_id);

ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select" ON public.savings_contributions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own insert" ON public.savings_contributions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own update" ON public.savings_contributions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own delete" ON public.savings_contributions FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_contributions;