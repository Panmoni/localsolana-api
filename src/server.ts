import express from 'express';
import * as dotenv from 'dotenv';
import { query } from './db';
import { program, connection, PublicKey } from './solana';
import * as anchor from '@coral-xyz/anchor';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 1. Accounts Endpoints
app.post('/accounts', async (req, res) => {
  const { wallet_address, username, email } = req.body;
  try {
    const result = await query(
      'INSERT INTO accounts (wallet_address, username, email) VALUES ($1, $2, $3) RETURNING id',
      [wallet_address, username, email]
    );
    res.status(201).json({ id: result[0].id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/accounts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM accounts WHERE id = $1', [id]);
    res.json(result[0] || { error: 'Account not found' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 2. Offers Endpoints (example)
app.post('/offers', async (req, res) => {
  const { creator_account_id, offer_type, min_amount } = req.body;
  try {
    const result = await query(
      'INSERT INTO offers (creator_account_id, offer_type, token, min_amount, max_amount, total_available_amount, rate_adjustment, terms, escrow_deposit_time_limit, fiat_payment_time_limit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [creator_account_id, offer_type, 'USDC', min_amount, min_amount * 2, min_amount * 4, 1.05, 'Cash only', '15 minutes', '30 minutes']
    );
    res.status(201).json({ id: result[0].id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 3. Escrow Endpoint (Build Instruction) - Temporarily simplified
app.post('/escrows/create', async (req, res) => {
  const { trade_id, escrow_id, seller, buyer, amount } = req.body;
  try {
    const instruction = await program.methods
      .createEscrow(
        new anchor.BN(escrow_id),
        new anchor.BN(trade_id),
        new anchor.BN(amount),
        false,
        null
      )
      .accounts({
        seller: new PublicKey(seller),
        buyer: new PublicKey(buyer),
        // escrow: PublicKey.findProgramAddressSync(
        //   [
        //     Buffer.from('escrow'),
        //     new anchor.BN(escrow_id).toArrayLike(Buffer, 'le', 8),
        //     new anchor.BN(trade_id).toArrayLike(Buffer, 'le', 8),
        //   ],
        //   program.programId
        // )[0],
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction();

    // Return raw instruction data instead of serializing for now
    res.json({
      keys: instruction.keys.map(k => ({ pubkey: k.pubkey.toBase58(), isSigner: k.isSigner, isWritable: k.isWritable })),
      programId: instruction.programId.toBase58(),
      data: instruction.data.toString('base64'),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
