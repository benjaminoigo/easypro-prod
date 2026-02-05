-- Enable cascading deletes for writer-related foreign keys
-- This drops existing FK constraints on the listed columns and recreates them with ON DELETE CASCADE.

DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT c.conname, conrelid::regclass AS table_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
    WHERE c.contype = 'f'
      AND (
        (t.relname = 'writers' AND a.attname = 'user_id')
        OR (t.relname = 'writer_status_logs' AND a.attname = 'writer_id')
        OR (t.relname = 'submissions' AND a.attname IN ('order_id', 'writer_id'))
        OR (t.relname = 'orders' AND a.attname = 'writer_id')
        OR (t.relname = 'payments' AND a.attname = 'writer_id')
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.table_name, fk.conname);
  END LOOP;
END $$;

ALTER TABLE writers
  ADD CONSTRAINT fk_writers_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE writer_status_logs
  ADD CONSTRAINT fk_writer_status_logs_writer_id
  FOREIGN KEY (writer_id) REFERENCES writers(id) ON DELETE CASCADE;

ALTER TABLE submissions
  ADD CONSTRAINT fk_submissions_order_id
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE submissions
  ADD CONSTRAINT fk_submissions_writer_id
  FOREIGN KEY (writer_id) REFERENCES writers(id) ON DELETE CASCADE;

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_writer_id
  FOREIGN KEY (writer_id) REFERENCES writers(id) ON DELETE CASCADE;

ALTER TABLE payments
  ADD CONSTRAINT fk_payments_writer_id
  FOREIGN KEY (writer_id) REFERENCES writers(id) ON DELETE CASCADE;
