# LocalSolana API

A TypeScript-based REST API for a peer-to-peer trading platform on Solana. Handles accounts, offers, trades and escrows with JWT authentication and PostgreSQL storage. Built for LocalSolana—a decentralized trading app.

## Features
- **Accounts**: Create and manage user accounts with wallet addresses.
- **Offers**: Post and browse trade offers (BUY/SELL) for USDC.
- **Trades**: Initiate and update trades, deducting offer amounts.
- **Escrows**: Create and manage Solana escrows (instruction generation only—no signing yet).
- **Auth**: JWT-based authentication tied to Solana wallet addresses.
- **DB**: PostgreSQL for off-chain state tracking.

## Prerequisites
- **Node.js**: v18+ (LTS recommended).
- **PostgreSQL**: v12+ with a `localsolana` database.
- **Solana**: Anchor setup with a deployed program (ID: `4PonUp1nPEzDPnRMPjTqufLT3f37QuBJGk1CVnsTXx7x`).
- **JWT**: Auth middleware (e.g., `@hono/auth-js`) configured with wallet-based tokens.

## Setup
1. **Clone the Repo**:
   ```bash
   git clone https://github.com/Panmoni/localsolana-api.git
   cd localsolana-api
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment**:
   - Create a `.env` file:
     ```env
     DATABASE_URL=postgres://localsolana:yourpassword@localhost:5432/localsolana
     JWT_SECRET=your-secret-here
     ```
   - Update `db.ts` with your DB connection if not using `.env`.

4. **Database Schema**:
   - Run the SQL migrations (assumed in `schema.sql`):
     ```bash
     psql -U localsolana -d localsolana -f schema.sql
     ```
   - Key tables: `accounts`, `offers`, `trades`, `escrows`.

5. **Start the Server**:
   ```bash
   npm run dev
   ```
   - Runs on `http://localhost:3000`.

## API Endpoints

### Authentication
- All endpoints require a JWT in the `Authorization: Bearer <token>` header.
- Tokens must include a wallet address in `verified_credentials` (e.g., `AczLKrdS6hFGNoTWg9AaS9xhuPfZgVTPxL2W8XzZMDjH`).

### 1. Accounts
- **POST /accounts**
  - **Body**: `{ wallet_address: string, username: string, email: string }`
  - **Returns**: `{ id: number }`
  - **Notes**: `username` ≤ 25 chars, `wallet_address` must match JWT.
  - **Example**:
    ```bash
    curl -X POST http://localhost:3000/accounts \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -d '{"wallet_address": "AczLKrdS6hFGNoTWg9AaS9xhuPfZgVTPxL2W8XzZMDjH", "username": "george", "email": "test@example.com"}'
    ```

- **GET /accounts/:id**
  - **Returns**: Account details.
  - **Example**:
    ```bash
    curl -X GET http://localhost:3000/accounts/4 -H "Authorization: Bearer $JWT"
    ```

- **PUT /accounts/:id**
  - **Body**: `{ username?: string, email?: string }`
  - **Returns**: `{ id: number }`
  - **Notes**: Restricted to owner.

- **GET /accounts/me**
  - **Returns**: Current user’s account details.

### 2. Offers
- **POST /offers**
  - **Body**: `{ creator_account_id: number, offer_type: "BUY" | "SELL", min_amount: number }`
  - **Returns**: `{ id: number }`
  - **Notes**: `min_amount` ≤ 1,000,000, creator must match JWT wallet.
  - **Example**:
    ```bash
    curl -X POST http://localhost:3000/offers \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -d '{"creator_account_id": 4, "offer_type": "SELL", "min_amount": 150}'
    ```

- **GET /offers**
  - **Query**: `?type=BUY|SELL&token=USDC`
  - **Returns**: Array of offers.

- **GET /offers/:id**
  - **Returns**: Offer details.

- **PUT /offers/:id**
  - **Body**: `{ min_amount?: number }`
  - **Returns**: `{ id: number }`
  - **Notes**: Restricted to creator.

- **DELETE /offers/:id**
  - **Returns**: `{ message: string }`
  - **Notes**: Restricted to creator.

### 3. Trades
- **POST /trades**
  - **Body**: `{ leg1_offer_id: number, leg2_offer_id?: number, from_fiat_currency?: string, destination_fiat_currency?: string, from_bank?: string, destination_bank?: string }`
  - **Returns**: `{ id: number }`
  - **Notes**: Deducts `min_amount` from `total_available_amount`.
  - **Example**:
    ```bash
    curl -X POST http://localhost:3000/trades \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -d '{"leg1_offer_id": 1}'
    ```

- **GET /trades**
  - **Query**: `?status=IN_PROGRESS&user=<account_id>`
  - **Returns**: Array of trades.

- **GET /my/trades**
  - **Returns**: Array of trades where user is seller or buyer.

- **GET /trades/:id**
  - **Returns**: Trade details.

- **PUT /trades/:id**
  - **Body**: `{ leg1_state?: string, overall_status?: string, fiat_paid?: boolean }`
  - **Returns**: `{ id: number }`
  - **Notes**: Restricted to seller or buyer; `fiat_paid: true` sets `leg1_fiat_paid_at`.

### 4. Escrows
- **POST /escrows/create**
  - **Body**: `{ trade_id: number, escrow_id: number, seller: string, buyer: string, amount: number, sequential?: boolean, sequential_escrow_address?: string }`
  - **Returns**: Solana instruction `{ keys: [], programId: string, data: string }`
  - **Notes**: `seller` must match JWT.

- **POST /escrows/fund**
  - **Body**: `{ escrow_id: number, trade_id: number, seller: string, seller_token_account: string, token_mint: string, amount: number }`
  - **Returns**: Solana instruction.

- **GET /escrows/:trade_id**
  - **Returns**: Escrow details.

- **GET /my/escrows**
  - **Returns**: Array of escrows where user is seller or buyer.
  - **Example**:
    ```bash
    curl -X GET http://localhost:3000/my/escrows -H "Authorization: Bearer $JWT"
    ```

- **POST /escrows/release**
  - **Body**: `{ escrow_id: number, trade_id: number, authority: string, buyer_token_account: string, arbitrator_token_account: string, sequential_escrow_token_account?: string }`
  - **Returns**: Solana instruction.

- **POST /escrows/cancel**
  - **Body**: `{ escrow_id: number, trade_id: number, seller: string, authority: string, seller_token_account?: string }`
  - **Returns**: Solana instruction.

- **POST /escrows/dispute**
  - **Body**: `{ escrow_id: number, trade_id: number, disputing_party: string, disputing_party_token_account: string, evidence_hash?: string }`
  - **Returns**: Solana instruction.

## Usage Notes
- **Escrow Instructions**: Endpoints like `/escrows/create` and `/escrows/fund` return Solana transaction instructions. Signing and submission happen client-side (e.g., via frontend).
- **Error Handling**: 400 for bad input, 403 for auth issues, 404 for not found, 500 for server errors.
- **JWT**: Generate tokens with a wallet address in `verified_credentials` (format: `blockchain`).

## Development
- **Tech Stack**: TypeScript, Express, Anchor (Solana), PostgreSQL.
- **Dependencies**: See `package.json`.
- **Scripts**:
  - `npm run dev`: Start with hot reload.
  - `npm start`: Production mode.

## Contributing
- Fork, branch, PR—standard Git flow.
- Keep it clean and test with `curl` or Postman.

## More Information

Visit the primary LocalSolana repo for more information: [https://github.com/Panmoni/localsolana](https://github.com/Panmoni/localsolana)

## License
MIT
