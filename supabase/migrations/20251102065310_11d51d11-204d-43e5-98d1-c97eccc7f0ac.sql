-- Add new columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS transaction_type TEXT,
ADD COLUMN IF NOT EXISTS applicable_to TEXT;

-- Migrate existing data
UPDATE public.transactions
SET 
  transaction_type = CASE 
    WHEN type = 'credit' THEN 'Income'
    WHEN type = 'debit' THEN 'Expense'
    ELSE 'Expense'
  END,
  applicable_to = 'Central'
WHERE transaction_type IS NULL;

-- Add UPDATE policy for transactions
CREATE POLICY "Allow public update access"
ON public.transactions
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Add DELETE policy for transactions
CREATE POLICY "Allow public delete access"
ON public.transactions
FOR DELETE
TO public
USING (true);