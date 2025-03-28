BEGIN;

-- Safety check
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'trades') THEN
        RAISE EXCEPTION 'Trades table does not exist';
    END IF;
END $$;

-- Update trades table
DO $$
BEGIN
    -- Update leg1_crypto_amount column
    PERFORM 1 FROM information_schema.columns
    WHERE table_name = 'trades' AND column_name = 'leg1_crypto_amount';
    IF FOUND THEN
        EXECUTE 'ALTER TABLE trades
                ALTER COLUMN leg1_crypto_amount TYPE DECIMAL(15,2) USING (leg1_crypto_amount::DECIMAL(15,2))';
    END IF;

    -- Update leg2_crypto_amount column
    PERFORM 1 FROM information_schema.columns
    WHERE table_name = 'trades' AND column_name = 'leg2_crypto_amount';
    IF FOUND THEN
        EXECUTE 'ALTER TABLE trades
                ALTER COLUMN leg2_crypto_amount TYPE DECIMAL(15,2) USING (leg2_crypto_amount::DECIMAL(15,2))';
    END IF;
END $$;

-- Update escrows table
DO $$
BEGIN
    -- Safety check
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'escrows') THEN
        -- Update amount column
        PERFORM 1 FROM information_schema.columns
        WHERE table_name = 'escrows' AND column_name = 'amount';
        IF FOUND THEN
            EXECUTE 'ALTER TABLE escrows
                    ALTER COLUMN amount TYPE DECIMAL(15,2) USING (amount::DECIMAL(15,2))';
        END IF;
    END IF;
END $$;

-- Update disputes table
DO $$
BEGIN
    -- Safety check
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'disputes') THEN
        -- Update bond_amount column
        PERFORM 1 FROM information_schema.columns
        WHERE table_name = 'disputes' AND column_name = 'bond_amount';
        IF FOUND THEN
            EXECUTE 'ALTER TABLE disputes
                    ALTER COLUMN bond_amount TYPE DECIMAL(15,2) USING (bond_amount::DECIMAL(15,2))';
        END IF;
    END IF;
END $$;

COMMIT;
