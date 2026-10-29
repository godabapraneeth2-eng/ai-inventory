/*
# Add customer email uniqueness

1. Purpose
   Customer emails identify ERP accounts and must be unique for deterministic seed data.
2. Change
   Adds a unique constraint to customers.email without removing or changing existing data.
3. Security
   No access policy changes.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'customers_email_key'
      AND conrelid = 'customers'::regclass
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_email_key UNIQUE (email);
  END IF;
END $$;
