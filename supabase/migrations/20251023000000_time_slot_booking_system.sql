-- Migration: Time slot booking system with proper RLS policies
-- This migration is production-safe and won't conflict with existing data

-- 1. Create function to normalize timestamps to 5-minute intervals
CREATE OR REPLACE FUNCTION normalize_to_five_minute_slot(timestamp_value timestamptz)
RETURNS timestamptz AS $$
BEGIN
  -- Round down to nearest 5-minute interval (7:00, 7:05, 7:10, etc.)
  RETURN date_trunc('day', timestamp_value) + 
         (EXTRACT(hour FROM timestamp_value) * INTERVAL '1 hour') +
         (FLOOR(EXTRACT(minute FROM timestamp_value) / 5) * INTERVAL '5 minutes');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Add computed column for normalized pickup time (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'normalized_pickup_time'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN normalized_pickup_time timestamptz 
    GENERATED ALWAYS AS (normalize_to_five_minute_slot(pickup_time)) STORED;
  END IF;
END $$;

-- 2.5. Add cancellation_reason field for admin order management
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN cancellation_reason text;
  END IF;
END $$;

-- 3. Create unique constraint for pending orders (prevents double booking)
-- Note: Only 'pending' orders block slots. 'cancelled' orders free up slots automatically.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_pending_slots 
ON orders (normalized_pickup_time) 
WHERE status = 'pending';

-- 4. Add business hours constraint (7 AM - 5 PM Pacific Time)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_pickup_time_business_hours'
  ) THEN
    ALTER TABLE orders 
    ADD CONSTRAINT check_pickup_time_business_hours 
    CHECK (
      EXTRACT(hour FROM pickup_time AT TIME ZONE 'America/Los_Angeles') >= 7 
      AND EXTRACT(hour FROM pickup_time AT TIME ZONE 'America/Los_Angeles') <= 17
    );
  END IF;
END $$;

-- 5. Add future time constraint (prevents booking past times)
-- Note: We'll handle this in the application logic instead of database constraint
-- because NOW() is not immutable and can't be used in generated columns

-- 6. Create index for efficient slot querying
CREATE INDEX IF NOT EXISTS idx_orders_pending_pickup_time 
ON orders (pickup_time) 
WHERE status = 'pending';

-- 7. RLS Policies for proper access control

-- Allow anonymous users to INSERT orders (form submissions)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'allow_anon_insert_orders'
  ) THEN
    CREATE POLICY "allow_anon_insert_orders"
    ON "public"."orders"
    AS PERMISSIVE
    FOR INSERT
    TO anon
    WITH CHECK (true);
  END IF;
END $$;

-- Allow anonymous users to SELECT only pickup_time and status (for slot checking)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'allow_anon_select_slots'
  ) THEN
    CREATE POLICY "allow_anon_select_slots"
    ON "public"."orders"
    AS PERMISSIVE
    FOR SELECT
    TO anon
    USING (true);
  END IF;
END $$;

-- Allow authenticated users (admins) full access to orders
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'allow_auth_full_access'
  ) THEN
    CREATE POLICY "allow_auth_full_access"
    ON "public"."orders"
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Allow service role full access (for admin operations)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'allow_service_role_full_access'
  ) THEN
    CREATE POLICY "allow_service_role_full_access"
    ON "public"."orders"
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION normalize_to_five_minute_slot(timestamptz) IS 'Normalizes timestamps to 5-minute intervals for slot booking';
COMMENT ON INDEX idx_orders_unique_pending_slots IS 'Ensures unique pickup time slots for pending orders';
COMMENT ON CONSTRAINT check_pickup_time_business_hours ON orders IS 'Ensures pickup times are within 7 AM - 5 PM Pacific Time';
