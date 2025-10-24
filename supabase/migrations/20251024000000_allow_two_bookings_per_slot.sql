-- Migration: Allow 2 bookings per 5-minute time slot
-- This migration modifies the booking system to allow 2 orders per slot instead of 1

-- 1. Drop the existing unique constraint that only allows 1 booking per slot
DROP INDEX IF EXISTS idx_orders_unique_pending_slots;

-- 2. Create a new function to count bookings per slot
CREATE OR REPLACE FUNCTION count_pending_bookings_for_slot(slot_time timestamptz)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM orders 
    WHERE normalized_pickup_time = slot_time 
    AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Create a new constraint that allows up to 2 bookings per slot
-- We'll use a check constraint with a function call
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_max_two_bookings_per_slot'
  ) THEN
    ALTER TABLE orders 
    ADD CONSTRAINT check_max_two_bookings_per_slot 
    CHECK (
      status != 'pending' OR 
      count_pending_bookings_for_slot(normalized_pickup_time) <= 2
    );
  END IF;
END $$;

-- 4. Create a partial index for efficient slot counting
CREATE INDEX IF NOT EXISTS idx_orders_pending_slots_count 
ON orders (normalized_pickup_time) 
WHERE status = 'pending';

-- 5. Add helpful comments
COMMENT ON FUNCTION count_pending_bookings_for_slot(timestamptz) IS 'Counts pending bookings for a specific time slot';
COMMENT ON CONSTRAINT check_max_two_bookings_per_slot ON orders IS 'Ensures maximum 2 pending bookings per 5-minute slot';
COMMENT ON INDEX idx_orders_pending_slots_count IS 'Efficient index for counting bookings per slot';
