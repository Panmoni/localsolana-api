import express, { Request, Response, Router, RequestHandler } from 'express';
import { query } from './db';
import { program, PublicKey } from './solana';
import * as anchor from '@coral-xyz/anchor';

const router: Router = express.Router();

// 1. Accounts Endpoints
// Create a new account
router.post('/accounts', async (req: Request, res: Response) => {
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

// Retrieve account details
router.get('/accounts/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM accounts WHERE id = $1', [id]);
    res.json(result[0] || { error: 'Account not found' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Update account info
router.put('/accounts/:id', (async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email } = req.body;
  try {
    const result = await query(
      'UPDATE accounts SET username = COALESCE($1, username), email = COALESCE($2, email) WHERE id = $3 RETURNING id',
      [username || null, email || null, id]
    );
    if (result.length === 0) return res.status(404).json({ error: 'Account not found' });
    res.json({ id: result[0].id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}) as RequestHandler);

// 2. Offers Endpoints
// Create a new offer
router.post('/offers', async (req: Request, res: Response) => {
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

// List offers (filterable by type, token, etc.)
router.get('/offers', async (req: Request, res: Response) => {
  const { type, token } = req.query;
  try {
    let sql = 'SELECT * FROM offers WHERE 1=1';
    const params: string[] = [];
    if (type) {
      sql += ' AND offer_type = $' + (params.length + 1);
      params.push(type as string);
    }
    if (token) {
      sql += ' AND token = $' + (params.length + 1);
      params.push(token as string);
    }
    const result = await query(sql, params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Get offer details
router.get('/offers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM offers WHERE id = $1', [id]);
    res.json(result[0] || { error: 'Offer not found' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}) as RequestHandler;

// Update an offer
router.put('/offers/:id', (async (req: Request, res: Response) => {
  const { id } = req.params;
  const { min_amount } = req.body;
  try {
    const result = await query(
      'UPDATE offers SET min_amount = COALESCE($1, min_amount) WHERE id = $2 RETURNING id',
      [min_amount || null, id]
    );
    if (result.length === 0) return res.status(404).json({ error: 'Offer not found' });
    res.json({ id: result[0].id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}) as RequestHandler);

// Delete an offer
router.delete('/offers/:id', (async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM offers WHERE id = $1 RETURNING id', [id]);
    if (result.length === 0) return res.status(404).json({ error: 'Offer not found' });
    res.json({ message: 'Offer deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}) as RequestHandler);

// 3. Trades Endpoints
// Initiate a trade by selecting leg1_offer_id (and optionally leg2_offer_id for sequential trades)
router.post('/trades', async (req: Request, res: Response) => {
  const { leg1_offer_id, leg2_offer_id } = req.body;
  try {
    const result = await query(
      'INSERT INTO trades (leg1_offer_id, leg2_offer_id, status) VALUES ($1, $2, $3) RETURNING id',
      [leg1_offer_id, leg2_offer_id || null, 'PENDING']
    );
    res.status(201).json({ id: result[0].id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// List trades (filter by status, user, etc.)
router.get('/trades', async (req: Request, res: Response) => {
  const { status, user } = req.query;
  try {
    let sql = 'SELECT * FROM trades WHERE 1=1';
    const params: string[] = [];
    if (status) {
      sql += ' AND status = $' + (params.length + 1);
      params.push(status as string);
    }
    if (user) {
      sql += ' AND (leg1_offer_id IN (SELECT id FROM offers WHERE creator_account_id = $' + (params.length + 1) + '))';
      params.push(user as string);
    }
    const result = await query(sql, params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Get trade details
router.get('/trades/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM trades WHERE id = $1', [id]);
    res.json(result[0] || { error: 'Trade not found' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 4. Escrows Endpoints
// Trigger create_escrow on Solana
router.post('/escrows/create', async (req: Request, res: Response) => {
  const { trade_id, escrow_id, seller, buyer, amount, sequential, sequential_escrow_address } = req.body;
  try {
    const instruction = await program.methods
      .createEscrow(
        new anchor.BN(escrow_id),
        new anchor.BN(trade_id),
        new anchor.BN(amount),
        sequential || false,
        sequential_escrow_address ? new PublicKey(sequential_escrow_address) : null
      )
      .accountsPartial({
        seller: new PublicKey(seller),
        buyer: new PublicKey(buyer),
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction();
    res.json({
      keys: instruction.keys.map((k: anchor.web3.AccountMeta) => ({
        pubkey: k.pubkey.toBase58(),
        isSigner: k.isSigner,
        isWritable: k.isWritable,
      })),
      programId: instruction.programId.toBase58(),
      data: instruction.data.toString('base64'),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Trigger deposit_funds on Solana
router.post('/escrows/fund', async (req: Request, res: Response) => {
  const { escrow_id, trade_id, seller, seller_token_account, token_mint } = req.body;
  try {
    const escrowPda = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), new anchor.BN(escrow_id).toArrayLike(Buffer, 'le', 8), new anchor.BN(trade_id).toArrayLike(Buffer, 'le', 8)],
      program.programId
    )[0];
    const escrowTokenPda = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow_token'), escrowPda.toBuffer()],
      program.programId
    )[0];
    const instruction = await program.methods
      .fundEscrow()
      .accountsPartial({
        seller: new PublicKey(seller),
        sellerTokenAccount: new PublicKey(seller_token_account),
        escrowTokenAccount: escrowTokenPda,
        tokenMint: new PublicKey(token_mint),
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .instruction();
    res.json({
      keys: instruction.keys.map((k: anchor.web3.AccountMeta) => ({
        pubkey: k.pubkey.toBase58(),
        isSigner: k.isSigner,
        isWritable: k.isWritable,
      })),
      programId: instruction.programId.toBase58(),
      data: instruction.data.toString('base64'),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Trigger release_funds (with sequential flag) on Solana
router.post('/escrows/release', async (req: Request, res: Response) => {
  const { escrow_id, trade_id, authority, buyer_token_account, arbitrator_token_account, sequential_escrow_token_account } = req.body;
  try {
    const escrowPda = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), new anchor.BN(escrow_id).toArrayLike(Buffer, 'le', 8), new anchor.BN(trade_id).toArrayLike(Buffer, 'le', 8)],
      program.programId
    )[0];
    const escrowTokenPda = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow_token'), escrowPda.toBuffer()],
      program.programId
    )[0];
    const instruction = await program.methods
      .releaseEscrow()
      .accountsPartial({
        authority: new PublicKey(authority),
        escrowTokenAccount: escrowTokenPda,
        buyerTokenAccount: new PublicKey(buyer_token_account),
        arbitratorTokenAccount: new PublicKey(arbitrator_token_account),
        sequentialEscrowTokenAccount: sequential_escrow_token_account ? new PublicKey(sequential_escrow_token_account) : null,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .instruction();
    res.json({
      keys: instruction.keys.map((k: anchor.web3.AccountMeta) => ({
        pubkey: k.pubkey.toBase58(),
        isSigner: k.isSigner,
        isWritable: k.isWritable,
      })),
      programId: instruction.programId.toBase58(),
      data: instruction.data.toString('base64'),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Trigger cancel_escrow
router.post('/escrows/cancel', async (req: Request, res: Response) => {
  const { escrow_id, trade_id, seller, authority, seller_token_account } = req.body;
  try {
    const escrowPda = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), new anchor.BN(escrow_id).toArrayLike(Buffer, 'le', 8), new anchor.BN(trade_id).toArrayLike(Buffer, 'le', 8)],
      program.programId
    )[0];
    const escrowTokenPda = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow_token'), escrowPda.toBuffer()],
      program.programId
    )[0];
    const instruction = await program.methods
      .cancelEscrow()
      .accountsPartial({
        seller: new PublicKey(seller),
        authority: new PublicKey(authority),
        escrowTokenAccount: escrowTokenPda,
        sellerTokenAccount: seller_token_account ? new PublicKey(seller_token_account) : null,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .instruction();
    res.json({
      keys: instruction.keys.map((k: anchor.web3.AccountMeta) => ({
        pubkey: k.pubkey.toBase58(),
        isSigner: k.isSigner,
        isWritable: k.isWritable,
      })),
      programId: instruction.programId.toBase58(),
      data: instruction.data.toString('base64'),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Trigger dispute_escrow
router.post('/escrows/dispute', async (req: Request, res: Response) => {
  const { escrow_id, trade_id, disputing_party, disputing_party_token_account, evidence_hash } = req.body;
  try {
    const escrowPda = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), new anchor.BN(escrow_id).toArrayLike(Buffer, 'le', 8), new anchor.BN(trade_id).toArrayLike(Buffer, 'le', 8)],
      program.programId
    )[0];
    const buyerBondPda = PublicKey.findProgramAddressSync(
      [Buffer.from('buyer_bond'), escrowPda.toBuffer()],
      program.programId
    )[0];
    const sellerBondPda = PublicKey.findProgramAddressSync(
      [Buffer.from('seller_bond'), escrowPda.toBuffer()],
      program.programId
    )[0];
    const evidenceHashArray = evidence_hash
      ? Buffer.from(evidence_hash).toJSON().data
      : new Array(32).fill(0);
    const instruction = await program.methods
      .openDisputeWithBond(evidenceHashArray as number[])
      .accountsPartial({
        disputingParty: new PublicKey(disputing_party),
        disputingPartyTokenAccount: new PublicKey(disputing_party_token_account),
        buyerBondAccount: buyerBondPda,
        sellerBondAccount: sellerBondPda,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .instruction();
    res.json({
      keys: instruction.keys.map((k: anchor.web3.AccountMeta) => ({
        pubkey: k.pubkey.toBase58(),
        isSigner: k.isSigner,
        isWritable: k.isWritable,
      })),
      programId: instruction.programId.toBase58(),
      data: instruction.data.toString('base64'),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
