-- ============================================================
-- Studio Yoga — Schéma initial
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  phone       text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'user'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- CLASSES
-- ============================================================
create table public.classes (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null default 'Cours de yoga',
  date_time          timestamptz not null,
  duration_minutes   integer not null default 60,
  max_participants   integer not null default 10,
  location           text not null default 'Studio',
  description        text,
  is_cancelled       boolean not null default false,
  created_at         timestamptz not null default now()
);

create index classes_date_time_idx on public.classes(date_time);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table public.bookings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  class_id    uuid not null references public.classes(id) on delete cascade,
  status      text not null default 'confirmed'
                check (status in ('confirmed', 'cancelled', 'waitlist')),
  created_at  timestamptz not null default now(),
  unique(user_id, class_id)
);

create index bookings_user_id_idx on public.bookings(user_id);
create index bookings_class_id_idx on public.bookings(class_id);

-- ============================================================
-- SESSION CARDS
-- ============================================================
create table public.session_cards (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  total_sessions      integer not null check (total_sessions > 0),
  remaining_sessions  integer not null check (remaining_sessions >= 0),
  purchase_price      numeric(10,2),
  expiry_date         date,
  stripe_payment_id   text,
  created_at          timestamptz not null default now(),
  constraint remaining_lte_total check (remaining_sessions <= total_sessions)
);

create index session_cards_user_id_idx on public.session_cards(user_id);

-- ============================================================
-- SESSION USAGE
-- ============================================================
create table public.session_usage (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references public.session_cards(id) on delete cascade,
  booking_id  uuid references public.bookings(id) on delete set null,
  class_id    uuid not null references public.classes(id) on delete cascade,
  used_at     timestamptz not null default now()
);

create index session_usage_card_id_idx on public.session_usage(card_id);
create index session_usage_booking_id_idx on public.session_usage(booking_id);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table public.payments (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.profiles(id) on delete cascade,
  stripe_session_id           text unique,
  stripe_payment_intent_id    text,
  amount                      numeric(10,2) not null,
  currency                    text not null default 'eur',
  status                      text not null default 'pending'
                                check (status in ('pending', 'completed', 'failed', 'refunded')),
  card_type                   text not null check (card_type in ('10', '20')),
  created_at                  timestamptz not null default now()
);

create index payments_user_id_idx on public.payments(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.bookings enable row level security;
alter table public.session_cards enable row level security;
alter table public.session_usage enable row level security;
alter table public.payments enable row level security;

-- Helper function: is current user admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- PROFILES ----
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

-- ---- CLASSES ----
create policy "Anyone authenticated can view classes"
  on public.classes for select
  to authenticated
  using (true);

create policy "Admins can manage classes"
  on public.classes for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---- BOOKINGS ----
create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can create own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bookings"
  on public.bookings for update
  using (auth.uid() = user_id or public.is_admin());

-- ---- SESSION CARDS ----
create policy "Users can view own cards"
  on public.session_cards for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can manage all cards"
  on public.session_cards for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can view own session usage"
  on public.session_usage for select
  using (
    exists (
      select 1 from public.session_cards
      where id = session_usage.card_id and user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "Service role can manage session usage"
  on public.session_usage for all
  using (public.is_admin());

-- ---- PAYMENTS ----
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id or public.is_admin());

-- ============================================================
-- SEED: First admin (replace with your email)
-- Run this manually after setup:
-- UPDATE public.profiles SET role = 'admin' WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'your-admin@email.com'
-- );
-- ============================================================
