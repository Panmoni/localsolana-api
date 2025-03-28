BEGIN;

-- Safety check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'offers') THEN
        RAISE EXCEPTION 'Offers table does not exist';
    END IF;
END $$;

-- Update rate_adjustment column precision
DO $$
BEGIN
    PERFORM 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'rate_adjustment';
    IF FOUND THEN
        EXECUTE 'ALTER TABLE offers
                ALTER COLUMN rate_adjustment TYPE DECIMAL(6,4) USING (rate_adjustment::DECIMAL(6,4))';
    END IF;
END $$;

COMMIT;
