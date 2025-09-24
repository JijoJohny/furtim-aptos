import React from 'react';
import { X } from 'lucide-react';

interface DashboardProps {
  onClose: () => void;
  showCloseButton?: boolean;
  isWalletConnected?: boolean;
  walletAddress?: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onClose,
  showCloseButton = false,
  isWalletConnected = false,
  walletAddress = null
}) => {

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-circle">
              <div className="smiley-face">
                <div className="eye left"></div>
                <div className="eye right"></div>
                <div className="mouth"></div>
                <div className="sparkle"></div>
              </div>
            </div>
            <span className="logo-text">furtim</span>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="blockchain-display">
            <div className="blockchain-logo">
              <div className="blockchain-icon">
                <div className="line line1"></div>
                <div className="line line2"></div>
                <div className="line line3"></div>
              </div>
              <span className="blockchain-name">Aptos</span>
            </div>
          </div>
          
          {isWalletConnected && walletAddress && (
            <div className="wallet-status">
              <div className="wallet-address">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
              <div className="wallet-indicator"></div>
            </div>
          )}
          
          {showCloseButton && (
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
