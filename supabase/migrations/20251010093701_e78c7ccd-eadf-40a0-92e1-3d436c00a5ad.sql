-- Create transactions table
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount decimal(10,2) NOT NULL,
  category text NOT NULL,
  description text,
  date timestamptz NOT NULL,
  added_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read all transactions
CREATE POLICY "Allow public read access"
  ON public.transactions
  FOR SELECT
  TO public
  USING (true);

-- Allow everyone to insert transactions
CREATE POLICY "Allow public insert access"
  ON public.transactions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Enable realtime for transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;