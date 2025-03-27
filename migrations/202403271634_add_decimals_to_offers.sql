BEGIN;

-- Safety check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'offers') THEN
        RAISE EXCEPTION 'Offers table does not exist';
    END IF;
END $$;

-- First fix any data that would violate constraints
UPDATE offers
SET total_available_amount = max_amount
WHERE total_available_amount < max_amount;

-- Drop constraints temporarily
ALTER TABLE offers
    DROP CONSTRAINT IF EXISTS offers_max_amount_check,
    DROP CONSTRAINT IF EXISTS offers_total_available_amount_check;

-- Modify columns
DO $$
BEGIN
    PERFORM 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'min_amount';
    IF FOUND THEN
        EXECUTE 'ALTER TABLE offers
                ALTER COLUMN min_amount TYPE DECIMAL(15,2) USING (min_amount::DECIMAL(15,2))';
    END IF;

    PERFORM 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'max_amount';
    IF FOUND THEN
        EXECUTE 'ALTER TABLE offers
                ALTER COLUMN max_amount TYPE DECIMAL(15,2) USING (max_amount::DECIMAL(15,2))';
    END IF;

    PERFORM 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'total_available_amount';
    IF FOUND THEN
        EXECUTE 'ALTER TABLE offers
                ALTER COLUMN total_available_amount TYPE DECIMAL(15,2) USING (total_available_amount::DECIMAL(15,2))';
    END IF;
END $$;

-- Recreate constraints
ALTER TABLE offers
    ADD CONSTRAINT offers_max_amount_check CHECK (max_amount >= min_amount),
    ADD CONSTRAINT offers_total_available_amount_check CHECK (total_available_amount >= max_amount);

COMMIT;
