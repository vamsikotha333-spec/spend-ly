
-- Seed master data on signup
DROP TRIGGER IF EXISTS on_auth_user_created_seed_master_data ON auth.users;
CREATE TRIGGER on_auth_user_created_seed_master_data
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_seed_master_data();

-- Seed default member "Central" on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_seed_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.members (user_id, name)
  VALUES (NEW.id, 'Central')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_seed_members ON auth.users;
CREATE TRIGGER on_auth_user_created_seed_members
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_seed_members();
