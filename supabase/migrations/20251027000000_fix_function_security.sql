-- Migration: Fix security warnings for functions with mutable search_path
-- This migration fixes the security vulnerability by setting a fixed search_path

-- Fix 1: normalize_to_five_minute_slot
CREATE OR REPLACE FUNCTION normalize_to_five_minute_slot(timestamp_value timestamptz)
RETURNS timestamptz 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = 'public'
AS $$
BEGIN
  -- Round down to nearest 5-minute interval (7:00, 7:05, 7:10, etc.)
  RETURN date_trunc('day', timestamp_value) + 
         (EXTRACT(hour FROM timestamp_value) * INTERVAL '1 hour') +
         (FLOOR(EXTRACT(minute FROM timestamp_value) / 5) * INTERVAL '5 minutes');
END;
$$;

-- Fix 2: count_pending_bookings_for_slot
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

-- Fix 3: is_taking_orders
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

-- Fix 4: get_current_role (SECURITY DEFINER function - needs extra care)
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

-- Fix 5: debug_auth_role (SECURITY DEFINER function - needs extra care)
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

-- Add helpful comments
COMMENT ON FUNCTION normalize_to_five_minute_slot(timestamptz) IS 'Normalizes timestamps to 5-minute intervals. Fixed search_path for security.';
COMMENT ON FUNCTION count_pending_bookings_for_slot(timestamptz) IS 'Counts pending bookings for a specific time slot. Fixed search_path for security.';
COMMENT ON FUNCTION is_taking_orders() IS 'Returns true if orders are currently being accepted. Fixed search_path for security.';
COMMENT ON FUNCTION public.get_current_role() IS 'Returns current user role. Fixed search_path for security.';
COMMENT ON FUNCTION public.debug_auth_role(json) IS 'Debug function to check auth role. Fixed search_path for security.';

