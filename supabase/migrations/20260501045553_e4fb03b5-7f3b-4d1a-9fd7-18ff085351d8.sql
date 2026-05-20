CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Income','Expense','Savings')),
  emoji TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX categories_type_name_unique ON public.categories (type, lower(name));

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update categories" ON public.categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete categories" ON public.categories FOR DELETE USING (true);

-- Seed Income
INSERT INTO public.categories (name, type, emoji) VALUES
  ('Salary','Income','💰'),
  ('Freelance','Income','💻'),
  ('Investment','Income','📈'),
  ('Gift','Income','🎁'),
  ('Other Income','Income','💵')
ON CONFLICT DO NOTHING;

-- Seed Expense
INSERT INTO public.categories (name, type, emoji) VALUES
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

-- Seed Savings
INSERT INTO public.categories (name, type, emoji) VALUES
  ('Emergency Fund','Savings','🆘'),
  ('Investment','Savings','📊'),
  ('FD','Savings','🏦'),
  ('PPF','Savings','🏛️'),
  ('Chitti Amount','Savings','💰'),
  ('LIC','Savings','📋'),
  ('Other Savings','Savings','💎')
ON CONFLICT DO NOTHING;