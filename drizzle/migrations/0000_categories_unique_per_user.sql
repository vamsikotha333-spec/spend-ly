CREATE UNIQUE INDEX IF NOT EXISTS categories_user_type_name_uniq
  ON public.categories (user_id, type, lower(name));