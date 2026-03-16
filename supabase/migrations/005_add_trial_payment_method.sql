-- ============================================================
-- Add 'trial' payment method for free trial sessions
-- ============================================================

-- Drop existing payment_method constraint
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_payment_method_check;

-- Add new constraint including 'trial'
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_payment_method_check
CHECK (payment_method IN ('card', 'on_site', 'trial'));

-- Update comment
COMMENT ON COLUMN public.bookings.payment_method IS 'Payment method: card (session card), on_site (pay at studio), or trial (free trial session)';
