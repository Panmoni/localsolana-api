# LocalSolana API Repo Notes


## Moving chain logic to frontend?
- routes.ts constracts tx instructions
- solana.ts
- package.json

Decide how much to move out of the API... this stuff frankly seems ok tho.

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
