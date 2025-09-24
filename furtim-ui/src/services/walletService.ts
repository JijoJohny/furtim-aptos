import { PectraWallet, PublicKey } from '../types/wallet';

export class WalletService {
  private static instance: WalletService;
  private wallet: PectraWallet | null = null;
  private isConnected = false;
  private publicKey: PublicKey | null = null;

  private constructor() {
    this.initializeWallet();
  }

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  private initializeWallet(): void {
    // Check for Pectra wallet first
    if (typeof window !== 'undefined' && window.pectra) {
      this.wallet = window.pectra;
    } else if (typeof window !== 'undefined' && window.solana) {
      // Fallback to Solana wallet if Pectra not available
      this.wallet = window.solana as PectraWallet;
    }
  }

  public async connect(): Promise<{ success: boolean; publicKey?: string; error?: string; needsInstall?: boolean }> {
    if (!this.wallet) {
      return {
        success: false,
        error: 'No wallet found. Please install a compatible wallet.',
        needsInstall: true
      };
    }

    try {
      const response = await this.wallet.connect();
      if (response.publicKey) {
        this.publicKey = response.publicKey;
        this.isConnected = true;
        return {
          success: true,
          publicKey: response.publicKey.toString()
        };
      } else {
        return {
          success: false,
          error: 'Failed to get public key from wallet'
        };
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to wallet'
      };
    }
  }

  public async disconnect(): Promise<void> {
    if (this.wallet && this.isConnected) {
      try {
        await this.wallet.disconnect();
        this.isConnected = false;
        this.publicKey = null;
      } catch (error) {
        console.error('Wallet disconnection error:', error);
      }
    }
  }

  public getPublicKey(): string | null {
    return this.publicKey?.toString() || null;
  }

  public isWalletConnected(): boolean {
    return this.isConnected && this.publicKey !== null;
  }

  public getWalletName(): string {
    if (this.wallet?.isPectra) {
      return 'Pectra';
    }
    return 'Solana';
  }

  public isWalletAvailable(): boolean {
    return this.wallet !== null;
  }

  public async signMessage(message: string): Promise<string | null> {
    if (!this.wallet || !this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      // This would be the actual message signing implementation
      // For now, we'll simulate it
      const encodedMessage = new TextEncoder().encode(message);
      // In a real implementation, you would call wallet.signMessage(encodedMessage)
      // Convert Uint8Array to string using Array.from for compatibility
      const charCodes = Array.from(encodedMessage);
      return btoa(String.fromCharCode(...charCodes));
    } catch (error) {
      console.error('Message signing error:', error);
      throw error;
    }
  }
}
