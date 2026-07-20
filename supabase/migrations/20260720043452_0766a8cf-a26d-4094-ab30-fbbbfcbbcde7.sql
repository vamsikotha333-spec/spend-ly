
REVOKE ALL ON FUNCTION public.seed_master_data_for_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_seed_master_data() FROM PUBLIC, anon, authenticated;
