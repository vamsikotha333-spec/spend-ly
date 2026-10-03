ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS investment_id uuid REFERENCES public.investments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS transactions_investment_id_idx ON public.transactions(investment_id);

CREATE OR REPLACE FUNCTION public.sync_linked_investment_amount()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') AND OLD.investment_id IS NOT NULL THEN
    UPDATE public.investments SET invested_amount = GREATEST(0, invested_amount - OLD.amount)
    WHERE id = OLD.investment_id AND user_id = OLD.user_id;
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.investment_id IS NOT NULL THEN
    UPDATE public.investments SET invested_amount = invested_amount + NEW.amount
    WHERE id = NEW.investment_id AND user_id = NEW.user_id;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER transactions_sync_linked_investment
AFTER INSERT OR UPDATE OF amount, investment_id OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_linked_investment_amount();