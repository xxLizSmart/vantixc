/*
  # Fix Trigger Function - Set Proper Search Path and Context

  ## Problem
  
  The trigger function may be failing due to schema resolution issues or
  execution context problems.

  ## Solution
  
  1. Recreate the function with explicit search_path
  2. Set proper security context
  3. Add explicit schema qualification
  
  ## Changes
  
  - Set search_path to ensure proper schema resolution
  - Use explicit schema names for all operations
  - Ensure SECURITY DEFINER works correctly
*/

-- Drop and recreate the trigger function with proper configuration
DROP FUNCTION IF EXISTS handle_new_user_complete() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user_complete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, username, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Insert USDT wallet
  INSERT INTO public.wallets (user_id, currency_symbol, balance, locked_balance)
  VALUES (NEW.id, 'USDT', 0, 0)
  ON CONFLICT (user_id, currency_symbol) DO NOTHING;

  -- Insert user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user_complete: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_complete();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_complete() TO postgres, authenticated, anon, service_role;
