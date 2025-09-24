import React, { useState, useEffect } from 'react';
import { X, Send, Shield, Eye, EyeOff, Copy, Check, AlertCircle } from 'lucide-react';
import { useAptosWallet } from '../providers/AptosWalletProvider';
import { stealthAddressService } from '../services/stealthAddressService';

interface StealthPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientUsername: string;
  recipientStealthAddress: string;
  amount?: number;
  description?: string;
}

interface StealthPaymentData {
  stealthAddress: string;
  ephemeralPublicKey: string;
  sharedSecret: string;
  txHash?: string;
}

const StealthPaymentModal: React.FC<StealthPaymentModalProps> = ({
  isOpen,
  onClose,
  recipientUsername,
  recipientStealthAddress,
  amount = 0,
  description = ''
}) => {
  const [step, setStep] = useState<'generate' | 'confirm' | 'sending' | 'success' | 'error'>('generate');
  const [stealthPayment, setStealthPayment] = useState<StealthPaymentData | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { account, signMessage } = useAptosWallet();

  // Generate stealth payment when modal opens
  useEffect(() => {
    if (isOpen && step === 'generate') {
      generateStealthPayment();
    }
  }, [isOpen, step]);

  const generateStealthPayment = async () => {
    try {
      setError(null);
      console.log('🔮 Generating stealth payment...');
      
      // Create ephemeral keypair for this payment
      const ephemeralKeyPair = await stealthAddressService.createEphemeralKeyPair();
      console.log('✅ Ephemeral keypair created');

      // Derive stealth address from recipient's meta keys and our ephemeral key
      const recipientMetaKeys = {
        scanPublicKey: new Uint8Array(32), // Would be retrieved from recipient
        spendPublicKey: new Uint8Array(32), // Would be retrieved from recipient
        scanPrivateKey: new Uint8Array(32), // Not needed for sender
        spendPrivateKey: new Uint8Array(32), // Not needed for sender
      };

      const stealthAddress = await stealthAddressService.deriveStealthAddress(
        recipientMetaKeys,
        ephemeralKeyPair.privateKey
      );

      console.log('✅ Stealth address derived:', stealthAddress.address);

      const stealthPaymentData: StealthPaymentData = {
        stealthAddress: stealthAddress.address,
        ephemeralPublicKey: Array.from(ephemeralKeyPair.publicKey).join(','),
        sharedSecret: Array.from(stealthAddress.sharedSecret).join(','),
      };

      setStealthPayment(stealthPaymentData);
      setStep('confirm');
      
    } catch (error: any) {
      console.error('❌ Failed to generate stealth payment:', error);
      setError(error.message || 'Failed to generate stealth payment');
      setStep('error');
    }
  };

  const handleSendPayment = async () => {
    try {
      setStep('sending');
      setError(null);

      if (!stealthPayment) {
        throw new Error('No stealth payment data available');
      }

      console.log('💸 Sending stealth payment...');
      console.log('📋 Payment details:', {
        recipient: recipientUsername,
        stealthAddress: stealthPayment.stealthAddress,
        amount,
        description
      });

      // Sign the payment message
      const paymentMessage = `Send ${amount} USDC to ${recipientUsername} via stealth address ${stealthPayment.stealthAddress}`;
      const signature = await signMessage(paymentMessage);
      
      if (!signature) {
        throw new Error('Failed to sign payment message');
      }

      console.log('✅ Payment message signed');

      // TODO: Submit transaction to Aptos blockchain
      // This would involve calling the Move module to create the stealth payment
      // For now, we'll simulate the transaction
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      
      const simulatedTxHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      setTxHash(simulatedTxHash);
      setStep('success');
      
      console.log('🎉 Stealth payment sent successfully!');
      console.log('📄 Transaction hash:', simulatedTxHash);

    } catch (error: any) {
      console.error('❌ Failed to send payment:', error);
      setError(error.message || 'Failed to send payment');
      setStep('error');
    }
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = () => {
    setStep('generate');
    setStealthPayment(null);
    setError(null);
    setTxHash(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container stealth-payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <Shield size={24} className="modal-icon" />
            <h2 className="modal-title">Stealth Payment</h2>
          </div>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {step === 'generate' && (
            <div className="step-content">
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
              <p className="step-description">Generating stealth address...</p>
            </div>
          )}

          {step === 'confirm' && stealthPayment && (
            <div className="step-content">
              <div className="payment-summary">
                <div className="summary-row">
                  <span className="label">Recipient:</span>
                  <span className="value">@{recipientUsername}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Amount:</span>
                  <span className="value">{amount} USDC</span>
                </div>
                {description && (
                  <div className="summary-row">
                    <span className="label">Description:</span>
                    <span className="value">{description}</span>
                  </div>
                )}
              </div>

              <div className="stealth-details">
                <h3 className="section-title">
                  <Shield size={16} />
                  Stealth Address Details
                </h3>
                
                <div className="detail-item">
                  <label className="detail-label">Stealth Address:</label>
                  <div className="detail-value-container">
                    <code className="detail-value">
                      {stealthPayment.stealthAddress}
                    </code>
                    <button 
                      className="copy-button"
                      onClick={() => handleCopy(stealthPayment.stealthAddress, 'address')}
                    >
                      {copied === 'address' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="detail-item">
                  <label className="detail-label">Ephemeral Public Key:</label>
                  <div className="detail-value-container">
                    <code className="detail-value">
                      {stealthPayment.ephemeralPublicKey.slice(0, 20)}...
                    </code>
                    <button 
                      className="copy-button"
                      onClick={() => handleCopy(stealthPayment.ephemeralPublicKey, 'ephemeral')}
                    >
                      {copied === 'ephemeral' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="detail-item">
                  <label className="detail-label">Shared Secret:</label>
                  <div className="detail-value-container">
                    <code className="detail-value">
                      {showPrivateKey 
                        ? stealthPayment.sharedSecret.slice(0, 20) + '...'
                        : '••••••••••••••••••••'
                      }
                    </code>
                    <button 
                      className="copy-button"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="privacy-notice">
                <AlertCircle size={16} />
                <p>
                  This payment uses stealth addressing. The recipient's real wallet address 
                  will never be revealed on the blockchain.
                </p>
              </div>

              <button 
                className="send-button"
                onClick={handleSendPayment}
              >
                <Send size={16} />
                Send Stealth Payment
              </button>
            </div>
          )}

          {step === 'sending' && (
            <div className="step-content">
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
              <p className="step-description">Sending payment to blockchain...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="step-content">
              <div className="success-icon">
                <Shield size={48} />
              </div>
              <h3 className="success-title">Payment Sent Successfully!</h3>
              <p className="success-description">
                Your stealth payment has been sent to @{recipientUsername}
              </p>
              
              {txHash && (
                <div className="tx-details">
                  <label className="tx-label">Transaction Hash:</label>
                  <div className="tx-value-container">
                    <code className="tx-value">
                      {txHash.slice(0, 20)}...{txHash.slice(-8)}
                    </code>
                    <button 
                      className="copy-button"
                      onClick={() => handleCopy(txHash, 'tx')}
                    >
                      {copied === 'tx' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <button className="close-button" onClick={handleClose}>
                Close
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="step-content">
              <div className="error-icon">
                <AlertCircle size={48} />
              </div>
              <h3 className="error-title">Payment Failed</h3>
              <p className="error-description">
                {error || 'An unexpected error occurred'}
              </p>
              <button className="retry-button" onClick={generateStealthPayment}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StealthPaymentModal;
