# Notes

### API
- add payment methods now or move to roadmap?

### add pricing server

redis, that new api, etc

### frontend

- README

Frontend: Since you’ve got Vite/React/Dynamic set up, wire up:
GET /accounts/me to show user info.
POST /offers, GET /offers, PUT /offers/:id for offer management.
POST /trades, PUT /trades/:id for trade flow.
POST /escrows/create and GET /escrows/:trade_id for escrow basics (use @solana/web3.js to sign/send transactions).

account page: implement /accounts/me

#### Offer Management UI
offers page
Create an “Offers” page with:
A form for POST /offers (fields: creator_account_id from /accounts/me, offer_type, min_amount).
A list from GET /offers.
An edit button for PUT /offers/:id.
Wire up API calls using your client.
Add basic validation (e.g., min_amount > 0).
Test creating and updating an offer.


#### Trades
trade page

Day 7 (March 27): Trade Initiation UI + Polish
Goals:
Add a basic trade creation flow.
Polish UX and test end-to-end.
Tasks:
On the “Offers” page, add a “Start Trade” button that calls POST /trades with leg1_offer_id.
Show a confirmation modal with trade details.
Test the full flow: login → create offer → start trade.
Fix any bugs and style it up (basic CSS/Bootstrap).


### Step 3: Set Up Standalone Event Listener
**Goal**: Monitor Solana program events independently of the API for debugging and verification.
- **Recommendation**: Keep the listener separate from the API to avoid tying event processing to HTTP server uptime. Run it as a standalone Node.js process.
- **Tasks**:
  1. **Create Listener Script**:
     - Write a new file (e.g., `src/eventListener.ts`) to listen for escrow-related events (e.g., `EscrowCreated`, `EscrowFunded`).
     - Use the Anchor program’s `addEventListener` to log events to the console.
  2. **Configure Listener**:
     - Set it to connect to Solana Devnet (or your preferred cluster).
     - Add environment variables for flexibility (e.g., `SOLANA_RPC_URL`).
  3. **Run Listener**:
     - Add a script in `package.json` (e.g., `"start:listener": "ts-node src/eventListener.ts"`) to launch it separately.
     - Start it with `npm run start:listener` and keep it running in a separate terminal.
  4. **Verify Events**:
     - Trigger an escrow action via the API (e.g., `/escrows/create`), sign and send the transaction, then check the listener logs for event output.


- go back and get the event listener from grok, set that up.



Event Listener: A TypeScript microservice subscribing to Solana events and upserting them into Postgres. own pod

Event Listener Role
The listener (ls-listener) runs independently in its own pod:

Purpose: Listens to Solana events (e.g., FundsDeposited, FundsReleased) via WebSocket and updates Postgres.
No API Dependency: Writes directly to Postgres, allowing the API and frontend to query the latest state.
Implementation: Use Node.js or Rust with a Postgres client (e.g., pg for Node.js) to process events like:
FundsDeposited: Update escrows.status to FUNDED and set deposit_timestamp.
FundsReleased: Update escrows.status to RELEASED and trade leg state to COMPLETED.

### List of Skipped Tests (To Do with Frontend)

1. **Buyer-Side Authorization in `PUT /trades/:id`**
   - **What**: Allow the buyer (not just the seller) to update trade status (e.g., mark `fiat_paid`).
   - **Why Skipped**: We updated the code in `routes.ts` to check both seller and buyer wallets, but didn’t test it with a buyer JWT yet since you want to hit it through the frontend.
   - **Test Plan**:
     - Generate a JWT for the buyer wallet (`BdRe6PgopWpmdsh6ZNbjwZTeN7i7vx8jLkcqJ6oLVERK`).
     - Call:
       ```bash
       curl -X PUT http://localhost:3000/trades/1 \
       -H "Authorization: Bearer $(cat buyer_jwt.txt)" \
       -H "Content-Type: application/json" \
       -d '{"leg1_state": "FIAT_PAID", "overall_status": "IN_PROGRESS", "fiat_paid": true}' | jq '.'
       ```
     - Expect: `{"id": 1}`
     - Verify: `curl -X GET http://localhost:3000/trades/1 | jq '.leg1_fiat_paid_at'` (should show a timestamp).
   - **Frontend Need**: Buyer auth flow to generate/use the JWT.

2. **Real Escrow Status Updates (On-Chain)**
   - **What**: Update `escrows.status` from `"CREATED"` to `"FUNDED"`, `"RELEASED"`, etc., after signing and submitting Solana transactions.
   - **Why Skipped**: We didn’t mock status updates in `POST /escrows/fund` (you chose to test it for real), and we’re not signing/submitting transactions yet—API just returns instructions.
   - **Test Plan**:
     - Call `POST /escrows/create` (already tested, returns instruction).
     - Sign and submit the instruction via Solana wallet (e.g., Phantom).
     - Call `POST /escrows/fund`:
       ```bash
       curl -X POST http://localhost:3000/escrows/fund \
       -H "Authorization: Bearer $(cat jwt.txt)" \
       -H "Content-Type: application/json" \
       -d '{"escrow_id": 1, "trade_id": 1, "seller": "AczLKrdS6hFGNoTWg9AaS9xhuPfZgVTPxL2W8XzZMDjH", "seller_token_account": "ZapTC6N5ohW1NKYH2w9F5LEjg9kaA3Yxe6wWpEREEic", "token_mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", "amount": 100}'
       ```
     - Sign and submit the fund instruction.
     - Check: `curl -X GET http://localhost:3000/escrows/1 | jq '.status'` (should still be `"CREATED"` until we add on-chain sync).
   - **Frontend Need**: Wallet integration (e.g., `@solana/wallet-adapter`) to sign/submit, plus a callback to update escrow status in the DB after confirmation.

3. **`POST /escrows/release`, `/escrows/cancel`, `/escrows/dispute`**
   - **What**: Generate and execute Solana instructions for releasing, canceling, or disputing escrows.
   - **Why Skipped**: We’ve got the endpoints returning instructions, but haven’t tested signing/submission or their effects (e.g., token transfers, status updates).
   - **Test Plan**:
     - **Release**:
       ```bash
       curl -X POST http://localhost:3000/escrows/release \
       -H "Authorization: Bearer $(cat jwt.txt)" \
       -H "Content-Type: application/json" \
       -d '{"escrow_id": 1, "trade_id": 1, "authority": "AczLKrdS6hFGNoTWg9AaS9xhuPfZgVTPxL2W8XzZMDjH", "buyer_token_account": "some_buyer_account", "arbitrator_token_account": "some_arbitrator_account"}'
       ```
     - **Cancel**:
       ```bash
       curl -X POST http://localhost:3000/escrows/cancel \
       -H "Authorization: Bearer $(cat jwt.txt)" \
       -H "Content-Type: application/json" \
       -d '{"escrow_id": 1, "trade_id": 1, "seller": "AczLKrdS6hFGNoTWg9AaS9xhuPfZgVTPxL2W8XzZMDjH", "authority": "AczLKrdS6hFGNoTWg9AaS9xhuPfZgVTPxL2W8XzZMDjH", "seller_token_account": "ZapTC6N5ohW1NKYH2w9F5LEjg9kaA3Yxe6wWpEREEic"}'
       ```
     - **Dispute**:
       ```bash
       curl -X POST http://localhost:3000/escrows/dispute \
       -H "Authorization: Bearer $(cat jwt.txt)" \
       -H "Content-Type: application/json" \
       -d '{"escrow_id": 1, "trade_id": 1, "disputing_party": "AczLKrdS6hFGNoTWg9AaS9xhuPfZgVTPxL2W8XzZMDjH", "disputing_party_token_account": "ZapTC6N5ohW1NKYH2w9F5LEjg9kaA3Yxe6wWpEREEic", "evidence_hash": "some_hash"}'
       ```
     - Sign and submit each instruction.
     - Verify state changes (e.g., `GET /escrows/1` or on-chain account data).
   - **Frontend Need**: Wallet signing, UI to trigger these actions, and post-transaction state sync.


## Roadmap
- prisma ORM instead of raw SQL?
- detailed tests
- postman?
- Test invalid inputs (e.g., missing fields, bad public keys) and verify error responses.
- Ensure the API handles Solana RPC failures gracefully.
- Write a README section with `curl` examples for each endpoint
## Ref
### API
#### create account
- curl -X POST http://localhost:3000/accounts \
-H "Content-Type: application/json" \
-d '{"wallet_address": "2ozy4RSqXbVvrE1kptN3UG4cseGcUEdKLjUQNtTULim8", "username": "testuser3", "email": "test3@example.com"}'
- curl -X POST http://localhost:3000/accounts \
-H "Authorization: Bearer $(cat jwt.txt)" \
-H "Content-Type: application/json" \
-d '{"wallet_address": "AczLKrdS6hFGNoTWg9AaS9xhuPfZgVTPxL2W8XzZMDjH", "username": "testuser45", "email": "test45@example.com"}'
### postgres
psql -h localhost -p 5432 -U localsolana -d localsolana
### Anchor related
- https://www.anchor-lang.com/docs/clients/typescript
- https://solana.stackexchange.com/questions/14342/why-does-typescript-throw-a-warning-for-resolvedaccounts-for-my-pda-in-my-anchor
- https://www.anchor-lang.com/docs/updates/release-notes/0-30-0#account-resolution
### dynamic related
- https://docs.dynamic.xyz/authentication-methods/how-to-validate-users-on-the-backend#option-3-do-it-yourself-verification
