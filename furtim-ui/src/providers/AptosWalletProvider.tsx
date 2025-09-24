import React, { createContext, useContext, ReactNode } from 'react';
import { Aptos, Network } from '@aptos-labs/ts-sdk';
import { WalletCore } from '@aptos-labs/wallet-adapter-core';

// Aptos wallet context
interface AptosWalletContextType {
  aptos: Aptos;
  wallet: WalletCore | null;
  connect: () => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  isSignedIn: boolean;
  account: string | null;
  isLoading: boolean;
  error: string | null;
}

const AptosWalletContext = createContext<AptosWalletContextType | undefined>(undefined);

interface AptosWalletProviderProps {
  children: ReactNode;
}

export const AptosWalletProvider: React.FC<AptosWalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = React.useState<WalletCore | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isSignedIn, setIsSignedIn] = React.useState(false);
  const [account, setAccount] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Initialize Aptos SDK
  const aptos = React.useMemo(() => {
    return new Aptos({
      network: Network.TESTNET, // Change to Network.MAINNET for production
    } as any); // Temporary type assertion to fix TypeScript issue
  }, []);

  // Check for existing wallet connection on mount
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        if (typeof window === 'undefined') return;

        console.log('Checking for wallet connections...');
        console.log('Available wallets:', {
          pectra: !!(window as any).pectra,
          aptos: !!(window as any).aptos,
          solana: !!(window as any).solana
        });

        // Check for Pectra wallet first
        if ((window as any).pectra) {
          const walletInstance = (window as any).pectra;
          console.log('Pectra wallet found:', walletInstance);
          
          if (walletInstance.isConnected && walletInstance.isConnected()) {
            console.log('Pectra wallet is connected, getting accounts...');
            const accounts = await walletInstance.accounts();
            console.log('Pectra accounts:', accounts);
            
            if (accounts && accounts.length > 0) {
              setWallet(walletInstance);
              setIsConnected(true);
              setAccount(accounts[0].address);
              console.log('Pectra wallet connected:', accounts[0].address);
              return;
            }
          }
        }

        // Check for Petra wallet
        if ((window as any).aptos) {
          const walletInstance = (window as any).aptos;
          console.log('Petra wallet found:', walletInstance);
          
          if (walletInstance.connected) {
            console.log('Petra wallet is connected, getting accounts...');
            const accounts = await walletInstance.accounts();
            console.log('Petra accounts:', accounts);
            
            if (accounts && accounts.length > 0) {
              setWallet(walletInstance);
              setIsConnected(true);
              setAccount(accounts[0].address);
              console.log('Petra wallet connected:', accounts[0].address);
              return;
            }
          }
        }

        console.log('No connected wallets found');
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    };

    checkConnection();

    // Add event listeners for wallet state changes
    const handleWalletChange = (event: any) => {
      console.log('Wallet state changed:', event);
      checkConnection();
    };

    // Listen for wallet events
    if (typeof window !== 'undefined') {
      window.addEventListener('aptos#initialized', handleWalletChange);
      window.addEventListener('aptos#connected', handleWalletChange);
      window.addEventListener('aptos#disconnected', handleWalletChange);
      window.addEventListener('aptos#accountChanged', handleWalletChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('aptos#initialized', handleWalletChange);
        window.removeEventListener('aptos#connected', handleWalletChange);
        window.removeEventListener('aptos#disconnected', handleWalletChange);
        window.removeEventListener('aptos#accountChanged', handleWalletChange);
      }
    };
  }, []);

  const connect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      let walletInstance = null;
      let response = null;

      // Try Pectra wallet first
      if ((window as any).pectra) {
        walletInstance = (window as any).pectra;
        console.log('Connecting to Pectra wallet...');
        response = await walletInstance.connect();
      }
      // Try Petra wallet as fallback
      else if ((window as any).aptos) {
        walletInstance = (window as any).aptos;
        console.log('Connecting to Petra wallet...');
        response = await walletInstance.connect();
      }
      else {
        throw new Error('No Aptos wallet found. Please install Pectra or Petra wallet.');
      }

      // Handle different response formats
      if (response) {
        let accounts = null;
        
        // Check for accounts in different response formats
        if (response.accounts && response.accounts.length > 0) {
          accounts = response.accounts;
        } else if (response.account) {
          accounts = [response.account];
        } else if (response.address) {
          accounts = [{ address: response.address }];
        }

        if (accounts && accounts.length > 0) {
          setWallet(walletInstance);
          setIsConnected(true);
          setAccount(accounts[0].address);
          console.log('Wallet connected successfully:', accounts[0].address);
        } else {
          // Try to get accounts directly from wallet
          const directAccounts = await walletInstance.accounts();
          if (directAccounts && directAccounts.length > 0) {
            setWallet(walletInstance);
            setIsConnected(true);
            setAccount(directAccounts[0].address);
            console.log('Wallet connected successfully (direct):', directAccounts[0].address);
          } else {
            throw new Error('No accounts found after connection');
          }
        }
      } else {
        throw new Error('No response from wallet connection');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signMessage = async (message: string): Promise<string | null> => {
    if (!wallet || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Signing message:', message);
      
      // Generate nonce (8 bytes hex)
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Generate issued at timestamp
      const issuedAt = new Date().toISOString();
      
      // Create structured message like Pivy format
      const structuredMessage = {
        message: `furtim.me wants you to sign in with your Aptos account:\n${account}\n\nWelcome to Furtim!\n\nURI: https://furtim.me\nVersion: 1\nChain ID: 1\nNonce: ${nonce}\nIssued At: ${issuedAt}`,
        nonce: nonce,
        address: account,
        domain: 'furtim.me',
        version: '1',
        chainId: 1,
        issuedAt: issuedAt
      };
      
      let signature = null;
      
      // Try different signing methods based on wallet type
      console.log('Wallet instance:', wallet);
      console.log('Available methods:', Object.keys(wallet));
      
      // Get the actual wallet instance from window
      const actualWallet = (window as any).pectra || (window as any).aptos;
      
      if (actualWallet) {
        console.log('Using actual wallet instance for signing');
        
        // Try signMessage with proper Aptos format
        if (actualWallet.signMessage) {
          console.log('Using signMessage method with Aptos format');
          try {
            const signMessageInput = {
              message: structuredMessage.message,
              nonce: structuredMessage.nonce
            };
            const response = await actualWallet.signMessage(signMessageInput);
            signature = response.signature;
          } catch (signError) {
            console.log('Aptos format failed, trying alternative:', signError);
            // Try with just the message string
            try {
              const response = await actualWallet.signMessage(structuredMessage.message);
              signature = response.signature || response;
            } catch (altError) {
              console.log('Alternative format also failed:', altError);
            }
          }
        }
        
        // If signMessage didn't work, try other methods
        if (!signature && actualWallet.sign) {
          console.log('Using sign method');
          try {
            signature = await actualWallet.sign(structuredMessage.message);
          } catch (signError) {
            console.log('Sign method failed:', signError);
          }
        }
        
        // Try personal_sign if available (common in web3 wallets)
        if (!signature && actualWallet.personal_sign) {
          console.log('Using personal_sign method');
          try {
            signature = await actualWallet.personal_sign(structuredMessage.message);
          } catch (personalSignError) {
            console.log('personal_sign method failed:', personalSignError);
          }
        }
      }
      
      if (signature) {
        console.log('Message signed successfully:', signature);
        console.log('Signed message structure:', structuredMessage);
        setIsSignedIn(true);
        return signature;
      } else {
        throw new Error('Failed to get signature from wallet. Please try a different wallet or check if signing is supported.');
      }
    } catch (err: any) {
      console.error('Message signing error:', err);
      setError(err.message || 'Failed to sign message');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      if (wallet && wallet.disconnect) {
        await wallet.disconnect();
      }
      setWallet(null);
      setIsConnected(false);
      setIsSignedIn(false);
      setAccount(null);
      setError(null);
    } catch (err) {
      console.error('Wallet disconnection error:', err);
    }
  };

  const value: AptosWalletContextType = {
    aptos,
    wallet,
    connect,
    signMessage,
    disconnect,
    isConnected,
    isSignedIn,
    account,
    isLoading,
    error,
  };

  return (
    <AptosWalletContext.Provider value={value}>
      {children}
    </AptosWalletContext.Provider>
  );
};

export const useAptosWallet = (): AptosWalletContextType => {
  const context = useContext(AptosWalletContext);
  if (context === undefined) {
    throw new Error('useAptosWallet must be used within an AptosWalletProvider');
  }
  return context;
};
