-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS escrows CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- 1. accounts: User profiles and wallet info
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(44) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telegram_username VARCHAR(50),
    telegram_id BIGINT,
    profile_photo_url TEXT,
    phone_country_code VARCHAR(5),
    phone_number VARCHAR(15),
    available_from TIME,
    available_to TIME,
    timezone VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. offers: Buy/sell offers for crypto-fiat trades
CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    creator_account_id INTEGER NOT NULL REFERENCES accounts(id),
    offer_type VARCHAR(4) NOT NULL CHECK (offer_type IN ('BUY', 'SELL')),
    token VARCHAR(10) NOT NULL DEFAULT 'USDC',
    fiat_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    min_amount DECIMAL(15,2) NOT NULL,
    max_amount DECIMAL(15,2) NOT NULL CHECK (max_amount >= min_amount),
    total_available_amount DECIMAL(15,2) NOT NULL CHECK (total_available_amount >= max_amount),
    rate_adjustment DECIMAL(6,4) NOT NULL,
    terms TEXT,
    escrow_deposit_time_limit INTERVAL NOT NULL,
    fiat_payment_time_limit INTERVAL NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. trades: Tracks trades with leg1 and leg2 details
CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    leg1_offer_id INTEGER REFERENCES offers(id),
    leg2_offer_id INTEGER REFERENCES offers(id),
    overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
    from_fiat_currency VARCHAR(3) NOT NULL,
    destination_fiat_currency VARCHAR(3) NOT NULL,
    from_bank VARCHAR(50),
    destination_bank VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Leg 1 (Buy Leg)
    leg1_state VARCHAR(25) NOT NULL CHECK (leg1_state IN ('CREATED', 'AWAITING_FIAT_PAYMENT', 'PENDING_CRYPTO_RELEASE', 'DISPUTED', 'COMPLETED', 'CANCELLED')),
    leg1_seller_account_id INTEGER REFERENCES accounts(id),
    leg1_buyer_account_id INTEGER REFERENCES accounts(id),
    leg1_crypto_token VARCHAR(10) NOT NULL DEFAULT 'USDC',
    leg1_crypto_amount DECIMAL(15,2) NOT NULL,
    leg1_fiat_amount DECIMAL(15,2),
    leg1_fiat_currency VARCHAR(3) NOT NULL,
    leg1_escrow_address VARCHAR(44) UNIQUE,
    leg1_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    leg1_escrow_deposit_deadline TIMESTAMP,
    leg1_fiat_payment_deadline TIMESTAMP,
    leg1_fiat_paid_at TIMESTAMP,
    leg1_released_at TIMESTAMP,
    leg1_cancelled_at TIMESTAMP,
    leg1_cancelled_by VARCHAR(44),
    leg1_dispute_id INTEGER,

    -- Leg 2 (Sell Leg, optional)
    leg2_state VARCHAR(20) CHECK (leg2_state IN ('CREATED', 'AWAITING_FIAT_PAYMENT', 'PENDING_CRYPTO_RELEASE', 'DISPUTED', 'COMPLETED', 'CANCELLED')),
    leg2_seller_account_id INTEGER REFERENCES accounts(id),
    leg2_buyer_account_id INTEGER REFERENCES accounts(id),
    leg2_crypto_token VARCHAR(10) DEFAULT 'USDC',
    leg2_crypto_amount DECIMAL(15,2),
    leg2_fiat_amount DECIMAL(15,2),
    leg2_fiat_currency VARCHAR(3),
    leg2_escrow_address VARCHAR(44) UNIQUE,
    leg2_created_at TIMESTAMP,
    leg2_escrow_deposit_deadline TIMESTAMP,
    leg2_fiat_payment_deadline TIMESTAMP,
    leg2_fiat_paid_at TIMESTAMP,
    leg2_released_at TIMESTAMP,
    leg2_cancelled_at TIMESTAMP,
    leg2_cancelled_by VARCHAR(44),
    leg2_dispute_id INTEGER
);

-- 4. escrows: Tracks on-chain escrow state
CREATE TABLE escrows (
    trade_id INTEGER NOT NULL REFERENCES trades(id),
    escrow_address VARCHAR(44) PRIMARY KEY,
    seller_address VARCHAR(44) NOT NULL,
    buyer_address VARCHAR(44) NOT NULL,
    token_type VARCHAR(10) NOT NULL DEFAULT 'USDC',
    amount DECIMAL(15,2) NOT NULL,
    deposit_timestamp TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('CREATED', 'FUNDED', 'RELEASED', 'CANCELLED', 'DISPUTED')),
    dispute_id INTEGER,
    sequential BOOLEAN NOT NULL,
    sequential_escrow_address VARCHAR(44),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. disputes: Tracks dispute lifecycle
CREATE TABLE disputes (
    id SERIAL PRIMARY KEY,
    trade_id INTEGER NOT NULL REFERENCES trades(id),
    escrow_address VARCHAR(44) NOT NULL REFERENCES escrows(escrow_address),
    initiator_address VARCHAR(44) NOT NULL,
    initiator_evidence_hash VARCHAR(64),
    responder_address VARCHAR(44),
    responder_evidence_hash VARCHAR(64),
    resolution_hash VARCHAR(64),
    bond_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('OPENED', 'RESPONDED', 'RESOLVED', 'DEFAULTED')),
    initiated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMP,
    resolved_at TIMESTAMP,
    winner_address VARCHAR(44)
);

-- Add foreign key constraints
ALTER TABLE trades
    ADD CONSTRAINT fk_leg1_dispute FOREIGN KEY (leg1_dispute_id) REFERENCES disputes(id),
    ADD CONSTRAINT fk_leg2_dispute FOREIGN KEY (leg2_dispute_id) REFERENCES disputes(id);

ALTER TABLE escrows
    ADD CONSTRAINT fk_dispute FOREIGN KEY (dispute_id) REFERENCES disputes(id);

-- Indexes for performance
CREATE INDEX idx_trades_overall_status ON trades(overall_status);
CREATE INDEX idx_escrows_status ON escrows(status);
CREATE INDEX idx_escrows_trade_id ON escrows(trade_id);
CREATE INDEX idx_disputes_trade_id ON disputes(trade_id);
