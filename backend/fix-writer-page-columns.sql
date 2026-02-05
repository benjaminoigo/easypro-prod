-- Fix writer page columns to support fractional pages
-- Run this in your database (e.g., Railway Data UI or psql).

ALTER TABLE writers
  ALTER COLUMN current_shift_pages TYPE numeric(10,2)
  USING current_shift_pages::numeric;

ALTER TABLE writers
  ALTER COLUMN total_pages_completed TYPE numeric(10,2)
  USING total_pages_completed::numeric;
