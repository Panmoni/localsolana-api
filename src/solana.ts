import { Connection, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import * as dotenv from 'dotenv';
import IDL from './idl/localsolana_contracts.json';
import { LocalsolanaContracts } from './types/localsolana_contracts';

dotenv.config();

// Set up connection
const connection = new Connection(process.env.SOLANA_RPC || 'https://api.devnet.solana.com', {
  wsEndpoint: process.env.SOLANA_WS || 'wss://api.devnet.solana.com',
});

// Program setup
const programId = new PublicKey(process.env.PROGRAM_ID || '4PonUp1nPEzDPnRMPjTqufLT3f37QuBJGk1CVnsTXx7x');
export const program = new Program<LocalsolanaContracts>(IDL, { connection });

// Exports
export { connection, PublicKey };
