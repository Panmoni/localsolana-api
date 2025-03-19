# API Server Functionality
The API (ls-api) will handle off-chain operations, integrating with Postgres and triggering Solana contract calls. Based on your requirements, here are the key endpoints:

1. Accounts
POST /accounts: Create a new account.
GET /accounts/:id: Retrieve account details.
PUT /accounts/:id: Update account info.
2. Offers
POST /offers: Create a new offer.
GET /offers: List offers (filterable by type, token, etc.).
GET /offers/:id: Get offer details.
PUT /offers/:id: Update an offer.
DELETE /offers/:id: Delete an offer.
3. Trades
POST /trades: Initiate a trade by selecting leg1_offer_id (and optionally leg2_offer_id for sequential trades).
GET /trades: List trades (filter by status, user, etc.).
GET /trades/:id: Get trade details.
4. Escrows
POST /escrows/create: Trigger create_escrow on Solana.
POST /escrows/fund: Trigger deposit_funds.
POST /escrows/release: Trigger release_funds (with sequential flag).
POST /escrows/cancel: Trigger cancel_escrow.
POST /escrows/dispute: Trigger dispute_escrow.
