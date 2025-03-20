# Notes

NEXT: add auth to routes, see latest grok.

add offer creation to frontend and test.

tsconfig warnings grr

#### Step 3: Set Up Standalone Event Listener
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



### other routes
- get ideas for routes from old LS. Which if any would be important for the MVP? Note other ones for post-MVP.

### test accounts
ly next implement the accounts stuff fully and test that, write tests for it.


### test blockchain stuff
- how to test the blockchain stuff via API?

- **Signing**: Start with a CLI signing utility for flexibility, then add a `/sign` endpoint if you want Postman convenience. Keep the test keypair secure and only use it for Devnet.


#### Step 2: Implement Transaction Signing for Testing
**Goal**: Enable testing of escrow endpoints by generating and signing transactions via `curl`, Postman, or tests.
- **Tasks**:
  1. **Design Signing Approach**:
     - Decide to return unsigned transaction instructions from escrow endpoints (e.g., `/escrows/create`, `/escrows/fund`).
     - Add a separate utility or endpoint to sign these instructions using a server-side keypair (for testing purposes).
  2. **Update Escrow Endpoints**:
     - Modify each escrow route to return serialized transaction instructions (base64-encoded) instead of just keys/programId/data.
     - Ensure responses include all necessary data for signing (e.g., instruction data, accounts, program ID).
  3. **Create Signing Utility**:
     - Build a standalone script (e.g., `signTransaction.ts`) that takes a base64 transaction string and a keypair, signs it, and returns the signed transaction.
     - Use a test keypair stored in an environment variable or file (e.g., `.env` with `TEST_KEYPAIR`).
  4. **Expose Signing via API (Optional)**:
     - Add a `/sign` POST endpoint that accepts a base64 transaction and returns the signed version (secured for testing only).
     - Alternatively, keep signing as a CLI tool for manual testing.
  5. **Test Transaction Flow**:
     - Use `curl` to hit `/escrows/create`, get the unsigned transaction.
     - Pass the transaction to the signing utility or `/sign` endpoint.
     - Send the signed transaction to Solana Devnet via `curl` to `https://api.devnet.solana.com` and verify success.

### Transaction Signing Options
- **Via `curl`/Postman**:
  - Hit an escrow endpoint, get the base64 transaction.
  - Use the signing utility (CLI or `/sign` endpoint) to sign it.
  - Send to Solana RPC with `curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"sendTransaction","params":["<base64_signed_tx>"]}' https://api.devnet.solana.com`.
- **Via Tests**:
  - Automate the above flow in Jest, using a test keypair to sign and submit transactions.

---



#### Step 4: Write Unit Tests
**Goal**: Automate testing of API endpoints and transaction flows.
- **Tasks**:
  1. **Set Up Testing Framework**:
     - Install a test runner (e.g., Jest with `jest`, `ts-jest`, `@types/jest`).
     - Configure it in `package.json` (e.g., `"test": "jest"`).
  2. **Test API Endpoints**:
     - Write tests for `/accounts`, `/offers`, and `/trades` CRUD operations using a library like `supertest` to simulate HTTP requests.
     - Mock the database (`query` function) to avoid real DB calls.
  3. **Test Escrow Transactions**:
     - Write a test that calls `/escrows/create`, signs the returned transaction with a test keypair, and submits it to Devnet.
     - Verify the transaction signature and check the listener logs for the corresponding event.
  4. **Run Tests**:
     - Execute `npm test` and ensure all pass.


### postman

### cleanup
**Handle Edge Cases**:
     - Test invalid inputs (e.g., missing fields, bad public keys) and verify error responses.
     - Ensure the API handles Solana RPC failures gracefully.


       4. **Document Testing Process**:
     - Write a README section with `curl` examples for each endpoint and the signing flow.



### maybe set up frontend with dynamic so I can test that?

## Spend all these credits

OR: $13 configured in Roo
https://openrouter.ai/settings/credits

OpenAI: $24 configured in Roo

Claude: $24 configured in Roo
https://console.anthropic.com/settings/keys

Deepseek $1.73: configured in Roo
https://platform.deepseek.com/usage

Maybe then pay for github co-pilot

## Roadmap
- prisma ORM instead of raw SQL

## Ref
### API
#### create account
curl -X POST http://localhost:3000/accounts \
-H "Content-Type: application/json" \
-d '{"wallet_address": "2ozy4RSqXbVvrE1kptN3UG4cseGcUEdKLjUQNtTULim8", "username": "testuser3", "email": "test3@example.com"}'

curl -X POST http://localhost:3000/accounts \
-H "Authorization: Bearer $(cat jwt.txt)" \
-H "Content-Type: application/json" \
-d '{"wallet_address": "AczLKrdS6hFGNoTWg9AaS9xhuPfZgVTPxL2W8XzZMDjH", "username": "testuser45", "email": "test45@example.com"}'

### postgres
psql -h localhost -p 5432 -U localsolana -d localsolana
