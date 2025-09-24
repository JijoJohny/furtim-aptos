import React from 'react';
import { ExternalLink, Download } from 'lucide-react';

interface WalletInstallPromptProps {
  onClose: () => void;
}

const WalletInstallPrompt: React.FC<WalletInstallPromptProps> = ({ onClose }) => {
  const handleInstallPectra = () => {
    // Open Pectra wallet installation page
    window.open('https://pectra.app', '_blank');
  };

  const handleInstallPetra = () => {
    // Open Petra wallet installation page
    window.open('https://petra.app', '_blank');
  };

  return (
    <div className="wallet-install-overlay">
      <div className="wallet-install-modal">
        <div className="modal-header">
          <h3>Install Wallet</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-content">
          <p>To connect your wallet, you need to install a compatible Aptos wallet extension.</p>
          
          <div className="wallet-options">
            <div className="wallet-option">
              <div className="wallet-info">
                <h4>Pectra Wallet</h4>
                <p>Recommended for Aptos blockchain</p>
              </div>
              <button className="install-button primary" onClick={handleInstallPectra}>
                <Download size={16} />
                Install Pectra
                <ExternalLink size={14} />
              </button>
            </div>
            
            <div className="wallet-option">
              <div className="wallet-info">
                <h4>Petra Wallet</h4>
                <p>Popular Aptos wallet alternative</p>
              </div>
              <button className="install-button secondary" onClick={handleInstallPetra}>
                <Download size={16} />
                Install Petra
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
          
          <div className="modal-footer">
            <p className="help-text">
              After installing, refresh the page and try connecting again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletInstallPrompt;
