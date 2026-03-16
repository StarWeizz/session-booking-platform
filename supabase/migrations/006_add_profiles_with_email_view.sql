-- ============================================================
-- Create view to join profiles with email from auth.users
-- ============================================================

-- Create a view that combines profiles with email
CREATE OR REPLACE VIEW public.profiles_with_email AS
SELECT
  p.*,
  u.email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- Grant access to authenticated users
GRANT SELECT ON public.profiles_with_email TO authenticated;
GRANT SELECT ON public.profiles_with_email TO service_role;

-- Add comment
COMMENT ON VIEW public.profiles_with_email IS 'Profiles joined with email from auth.users';
