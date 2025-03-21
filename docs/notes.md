# Notes

### API
- README

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
