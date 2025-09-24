import React, { useState, useEffect, useCallback } from 'react';
import { Lock, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import Dashboard from './Dashboard';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '../providers/AuthProvider';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import './PinVerification.css';

interface PinVerificationProps {
  onBack: () => void;
  username: string;
}

const PinVerification: React.FC<PinVerificationProps> = ({ onBack, username }) => {
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [walletVerified, setWalletVerified] = useState(false);
  const [walletVerifying, setWalletVerifying] = useState(false);
  const [walletSignature, setWalletSignature] = useState<string>('');
  const [walletMessage, setWalletMessage] = useState<string>('');
  const { verifyPin, isLoading, error, clearError } = useAuth();
  const { account, signMessage, connected } = useWallet();

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      // Move to previous input on backspace
      const prevInput = document.getElementById(`pin-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleWalletVerification = useCallback(async () => {
    if (!connected || !account || !signMessage) {
      return;
    }

    setWalletVerifying(true);
    clearError();

    try {
      const timestamp = Date.now();
      const message = `Furtim PIN Verification\nAccount: ${username}\nTimestamp: ${timestamp}\nWallet: ${account.address}`;
      
      const signature = await signMessage({
        message,
        nonce: timestamp.toString()
      });

      if (signature) {
        setWalletVerified(true);
        // Handle different signature formats
        const signatureString = typeof signature === 'string' 
          ? signature 
          : (signature as any)?.signature || JSON.stringify(signature);
        setWalletSignature(signatureString);
        setWalletMessage(message);
        console.log('Wallet verification successful');
      }
    } catch (error) {
      console.error('Wallet verification failed:', error);
      setWalletVerified(false);
      setWalletSignature('');
      setWalletMessage('');
    } finally {
      setWalletVerifying(false);
    }
  }, [connected, account, signMessage, username, clearError]);

  // Auto-trigger wallet verification when PIN is complete
  useEffect(() => {
    const pinString = pin.join('');
    if (pinString.length === 4 && connected && account && !walletVerified && !walletVerifying) {
      handleWalletVerification();
    }
  }, [pin, connected, account, walletVerified, walletVerifying, handleWalletVerification]);

  const handleSubmit = async () => {
    const pinString = pin.join('');
    if (pinString.length !== 4) return;

    if (!walletVerified) {
      await handleWalletVerification();
      return;
    }

    clearError();
    await verifyPin(pinString, walletSignature, walletMessage, account?.address?.toString());
  };

  const isPinComplete = pin.every(digit => digit !== '');
  const canSubmit = isPinComplete && walletVerified && !isLoading;

  return (
    <div className="pin-verification-container">
      <Dashboard 
        walletAddress={null} 
        onClose={onBack}
        showCloseButton={true}
        isWalletConnected={true}
      />
      
      <div className="pin-verification-main">
        <div className="pin-verification-content">
          <div className="pin-verification-header">
            <button className="back-button" onClick={onBack}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="pin-verification-title">Welcome Back</h1>
            <p className="pin-verification-subtitle">
              Enter your PIN to access your account
            </p>
            <div className="username-display">
              <span className="username-label">Signed in as:</span>
              <span className="username-value">@{username}</span>
            </div>
          </div>

          <div className="pin-input-container">
            <label htmlFor="pin-0" className="pin-label">
              Enter your 4-digit PIN
            </label>
            <div className="pin-inputs">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="pin-input"
                  disabled={isLoading}
                  autoComplete="off"
                />
              ))}
            </div>
            
            {/* Wallet Verification Status */}
            {isPinComplete && (
              <div className="wallet-verification-status">
                {walletVerifying && (
                  <div className="verification-status verifying">
                    <Shield size={16} />
                    <span>Verifying wallet signature...</span>
                  </div>
                )}
                {walletVerified && (
                  <div className="verification-status verified">
                    <CheckCircle size={16} />
                    <span>Wallet verified successfully</span>
                  </div>
                )}
                {!connected && isPinComplete && (
                  <div className="verification-status error">
                    <Shield size={16} />
                    <span>Wallet not connected</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>

          <div className="pin-verification-actions">
            <button 
              className={`pin-verification-button ${!canSubmit ? 'disabled' : ''}`}
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              <Lock size={16} />
              {isLoading ? 'Verifying PIN...' : 
               walletVerifying ? 'Verifying Wallet...' :
               !walletVerified ? 'Verify Wallet First' : 'Access Account'}
            </button>
          </div>

          <div className="pin-verification-help">
            <p className="help-text">
              Having trouble? Make sure you're using the correct PIN for this account.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="fixed-bottom-navigation">
        <BottomNavigation activeTab="home" />
      </div>
    </div>
  );
};

export default PinVerification;
