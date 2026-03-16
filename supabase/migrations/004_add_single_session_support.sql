-- Migration: Add support for single session cards (type '1')
-- This updates the payments table constraint to accept '1' as a valid card_type

-- Drop existing constraint
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_card_type_check;

-- Add new constraint with '1' included
ALTER TABLE public.payments
ADD CONSTRAINT payments_card_type_check
CHECK (card_type IN ('1', '10', '20'));
