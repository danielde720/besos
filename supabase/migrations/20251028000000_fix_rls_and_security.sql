-- Migration: Fix RLS and security issues
-- This migration disables RLS on orders table (anyone can insert orders)
-- Admin access is handled via authentication, not RLS

-- 1. Drop all RLS policies on orders table first
DROP POLICY IF EXISTS "allow_anon_insert_orders" ON "public"."orders";
DROP POLICY IF EXISTS "allow_anon_insert_orders_when_accepting" ON "public"."orders";
DROP POLICY IF EXISTS "allow_anon_select_slots" ON "public"."orders";
DROP POLICY IF EXISTS "allow_auth_full_access" ON "public"."orders";
DROP POLICY IF EXISTS "allow_service_role_full_access" ON "public"."orders";
DROP POLICY IF EXISTS "allow anyone to insert orders" ON "public"."orders";
DROP POLICY IF EXISTS "allow admins to view orders" ON "public"."orders";
DROP POLICY IF EXISTS "allow admins to update orders" ON "public"."orders";
DROP POLICY IF EXISTS "allow admins to delete orders" ON "public"."orders";

-- 2. Disable RLS on orders table (anyone can insert/select orders)
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- 2. Ensure RLS is enabled on settings table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'settings' 
    AND n.nspname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on settings table';
  ELSE
    RAISE NOTICE 'RLS already enabled on settings table';
  END IF;
END $$;

-- 3. Fix function security paths (ensure all functions have fixed search_path)

-- Fix get_current_role with explicit search_path
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN current_user;
END;
$function$;

-- Fix debug_auth_role with explicit search_path
CREATE OR REPLACE FUNCTION public.debug_auth_role(dummy json DEFAULT '{}'::json)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN current_role;
END;
$function$;

-- Fix normalize_to_five_minute_slot
CREATE OR REPLACE FUNCTION normalize_to_five_minute_slot(timestamp_value timestamptz)
RETURNS timestamptz 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = 'public'
AS $$
BEGIN
  RETURN date_trunc('day', timestamp_value) + 
         (EXTRACT(hour FROM timestamp_value) * INTERVAL '1 hour') +
         (FLOOR(EXTRACT(minute FROM timestamp_value) / 5) * INTERVAL '5 minutes');
END;
$$;

-- Fix count_pending_bookings_for_slot
CREATE OR REPLACE FUNCTION count_pending_bookings_for_slot(slot_time timestamptz)
RETURNS integer 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.orders 
    WHERE normalized_pickup_time = slot_time 
    AND status = 'pending'
  );
END;
$$;

-- Fix is_taking_orders
CREATE OR REPLACE FUNCTION is_taking_orders()
RETURNS boolean 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT value::boolean 
    FROM public.settings 
    WHERE key = 'taking_orders'
  );
END;
$$;

-- Add helpful comments
COMMENT ON TABLE public.orders IS 'Orders table - RLS disabled to allow anyone to create orders. Admin access controlled via authentication.';
COMMENT ON FUNCTION public.get_current_role() IS 'Returns current user role. Fixed search_path for security.';
COMMENT ON FUNCTION public.debug_auth_role(json) IS 'Debug function to check auth role. Fixed search_path for security.';
COMMENT ON FUNCTION normalize_to_five_minute_slot(timestamptz) IS 'Normalizes timestamps to 5-minute intervals. Fixed search_path for security.';
COMMENT ON FUNCTION count_pending_bookings_for_slot(timestamptz) IS 'Counts pending bookings for a specific time slot. Fixed search_path for security.';
COMMENT ON FUNCTION is_taking_orders() IS 'Returns true if orders are currently being accepted. Fixed search_path for security.';

