/*
  # Register User Without Email Confirmation

  Creates a SECURITY DEFINER RPC function `register_user(email, password)`
  that inserts directly into auth.users with email_confirmed_at pre-set,
  bypassing Supabase's email sending entirely.

  This solves the "email rate limit exceeded" error on signup.
*/

CREATE OR REPLACE FUNCTION public.register_user(
  p_email    text,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public, auth
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Reject blank inputs
  IF p_email IS NULL OR p_email = '' THEN
    RETURN json_build_object('error', 'Email is required');
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RETURN json_build_object('error', 'Password must be at least 6 characters');
  END IF;

  -- Check duplicate
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))) THEN
    RETURN json_build_object('error', 'User already registered');
  END IF;

  v_user_id := gen_random_uuid();

  -- Insert into auth.users with email pre-confirmed (no email sent)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf')),
    now(),            -- pre-confirmed: no email needed
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  );

  -- Create zero-balance profile row
  INSERT INTO public.profiles (
    id, username,
    btc_balance, eth_balance, usdc_balance,
    usdt_balance, xrp_balance, sol_balance,
    kyc_status, is_admin
  ) VALUES (
    v_user_id,
    split_part(lower(trim(p_email)), '@', 1),
    0, 0, 0, 0, 0, 0,
    'not_verified', false
  ) ON CONFLICT (id) DO NOTHING;

  RETURN json_build_object('success', true, 'user_id', v_user_id::text);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Grant execute to unauthenticated users so the login page can call it
GRANT EXECUTE ON FUNCTION public.register_user(text, text) TO anon, authenticated;
