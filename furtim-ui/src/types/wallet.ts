// Wallet types for Pectra wallet integration
export interface WalletAdapter {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connect(): Promise<WalletAdapter>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}

export interface PublicKey {
  toString(): string;
  toBase58(): string;
}

export interface Transaction {
  // Transaction properties
}

// Pectra wallet specific types
export interface PectraWallet {
  isPectra: boolean;
  connect(): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
}

// Extend window object for wallet
declare global {
  interface Window {
    solana?: PectraWallet;
    pectra?: PectraWallet;
  }
}
