BEGIN;

-- Safety check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'offers') THEN
        RAISE EXCEPTION 'Offers table does not exist';
    END IF;
END $$;

-- Add fiat_currency column with default value
ALTER TABLE offers
    ADD COLUMN IF NOT EXISTS fiat_currency VARCHAR(3) NOT NULL DEFAULT 'USD';

-- Update any existing records to have USD as currency
UPDATE offers
SET fiat_currency = 'USD'
WHERE fiat_currency IS NULL;

COMMIT;
