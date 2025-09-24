import React from 'react';
import AnimatedContent from './AnimatedContent';
import StyledConnectButton from './StyledConnectButton';

interface ConnectWalletProps {
  onConnectWallet?: () => void;
  isWalletConnected?: boolean;
  isSignedIn?: boolean;
  isConnecting?: boolean;
  walletError?: string | null;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ 
  onConnectWallet,
  isWalletConnected = false,
  isSignedIn = false,
  isConnecting = false,
  walletError = null
}) => {

  return (
    <div className="connect-wallet-container">
      <div className="main-content">
        <div className="hero-section">
          <h1 className="main-headline">Get Paid, Stay Private</h1>
          <p className="description">
            The self-custodial payment toolkit that keeps your real wallet{' '}
            <span className="highlight">private</span> using{' '}
            <span className="highlight">Stealth Addresses</span>.
          </p>
          
          <div className="feature-badge">
            <span className="sparkle-icon">✨</span>
            <span>The First Ever Stealth Address Implementation on Aptos •</span>
          </div>
        </div>

        <AnimatedContent />
        
        {walletError && (
          <div className="wallet-error">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{walletError}</div>
          </div>
        )}
        
        <StyledConnectButton 
          onConnectWallet={onConnectWallet}
          isWalletConnected={isWalletConnected}
          isSignedIn={isSignedIn}
          isConnecting={isConnecting}
        />
      </div>
    </div>
  );
};

export default ConnectWallet;
