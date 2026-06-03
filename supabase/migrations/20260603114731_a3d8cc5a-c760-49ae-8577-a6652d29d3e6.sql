-- 1. Add new columns (backward compatible defaults)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS budget_tracking boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- 2. Backfill is_default for existing user categories that match the templates
UPDATE public.categories c
   SET is_default = true
  FROM public.category_templates t
 WHERE lower(c.name) = lower(t.name)
   AND c.type = t.type
   AND c.is_default = false;

-- 3. Update the signup seed trigger to flag seeded rows as defaults
CREATE OR REPLACE FUNCTION public.handle_new_user_seed_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.categories (name, type, emoji, user_id, is_default, budget_tracking)
  SELECT t.name, t.type, t.emoji, NEW.id, true, true
  FROM public.category_templates t
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;