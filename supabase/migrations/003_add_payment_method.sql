-- ============================================================
-- Add payment_method column to bookings table
-- ============================================================

-- Add payment_method column with default 'card'
alter table public.bookings
add column payment_method text not null default 'card'
  check (payment_method in ('card', 'on_site'));

-- Add comment for clarity
comment on column public.bookings.payment_method is 'Payment method: card (session card) or on_site (pay at studio)';