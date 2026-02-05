-- Ensure orders.order_number is unique.
-- If duplicates exist, resolve them before running this.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
    WHERE c.contype = 'u'
      AND t.relname = 'orders'
      AND a.attname = 'order_number'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);
  END IF;
END $$;
