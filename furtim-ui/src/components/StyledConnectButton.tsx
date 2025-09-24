import React from 'react';
import { ArrowRight } from 'lucide-react';

interface StyledConnectButtonProps {
  onConnectWallet?: () => void;
  isWalletConnected?: boolean;
  isSignedIn?: boolean;
  isConnecting?: boolean;
}

const StyledConnectButton: React.FC<StyledConnectButtonProps> = ({ 
  onConnectWallet,
  isWalletConnected = false,
  isSignedIn = false,
  isConnecting = false
}) => {
  const getWalletText = () => {
    if (isConnecting) {
      return 'Connecting...';
    }
    
    if (isSignedIn) {
      return 'Continue to Setup';
    }
    
    if (isWalletConnected) {
      return 'Sign in to Continue';
    }
    
    return 'Connect your Aptos Wallet';
  };

  return (
    <div className="connect-button-container">
      <button 
        className="styled-connect-button" 
        onClick={onConnectWallet}
        disabled={isConnecting}
      >
        <div className="button-content">
          <span className="button-text">{getWalletText()}</span>
          {!isConnecting && (
            <div className="button-icon">
              <ArrowRight size={20} />
            </div>
          )}
        </div>
        <div className="button-glow"></div>
      </button>
    </div>
  );
};

export default StyledConnectButton;
