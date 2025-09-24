import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Shield, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { useAptosWallet } from '../providers/AptosWalletProvider';
import { stealthAddressService } from '../services/stealthAddressService';

interface ClaimablePayment {
  id: string;
  paymentId: number;
  stealthAddress: string;
  amount: number;
  coinType: string;
  txHash: string;
  blockNumber: number;
  createdAt: string;
  ephemeralPublicKey?: string;
}

interface StealthScannerProps {
  onPaymentClaimed?: (payment: ClaimablePayment) => void;
}

const StealthScanner: React.FC<StealthScannerProps> = ({ onPaymentClaimed }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [claimablePayments, setClaimablePayments] = useState<ClaimablePayment[]>([]);
  const [claimingPayment, setClaimingPayment] = useState<string | null>(null);
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const { user, isAuthenticated } = useAuth();
  const { account, signMessage } = useAptosWallet();

  // Auto-scan when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      scanForPayments();
    }
  }, [isAuthenticated, user]);

  // Auto-scan every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      scanForPayments();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const scanForPayments = async () => {
    if (!user) return;

    try {
      setIsScanning(true);
      setScanError(null);
      
      console.log('🔍 Scanning for stealth payments...');
      
      // Call backend API to scan for claimable payments
      const response = await fetch('/api/stealth/scan', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to scan for payments');
      }

      const data = await response.json();
      
      if (data.success) {
        setClaimablePayments(data.data || []);
        setLastScanTime(new Date());
        console.log(`✅ Found ${data.data?.length || 0} claimable payments`);
      } else {
        throw new Error(data.message || 'Scan failed');
      }
      
    } catch (error: any) {
      console.error('❌ Scan error:', error);
      setScanError(error.message || 'Failed to scan for payments');
    } finally {
      setIsScanning(false);
    }
  };

  const claimPayment = async (payment: ClaimablePayment) => {
    if (!user || !account) return;

    try {
      setClaimingPayment(payment.id);
      console.log(`🎯 Claiming payment ${payment.paymentId}...`);

      // Get user's meta keys for claiming
      const metaKeys = await stealthAddressService.generateMetaKeys('user_pin', 'user_signature');
      
      // Compute shared secret proof
      const sharedSecret = await stealthAddressService.computeSharedSecret(
        metaKeys.scanPrivateKey,
        new Uint8Array(payment.ephemeralPublicKey?.split(',').map(Number) || [])
      );

      const sharedSecretProof = Array.from(sharedSecret).join(',');

      // Sign the claim message
      const claimMessage = `Claim stealth payment ${payment.paymentId} for ${payment.amount} ${payment.coinType}`;
      const signature = await signMessage(claimMessage);
      
      if (!signature) {
        throw new Error('Failed to sign claim message');
      }

      // Submit claim request to backend
      const response = await fetch('/api/stealth/claim', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.paymentId,
          stealthAddress: payment.stealthAddress,
          ephemeralPublicKey: payment.ephemeralPublicKey,
          sharedSecretProof,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('🎉 Payment claimed successfully!');
        console.log('📄 Transaction hash:', data.data.txHash);
        
        // Remove claimed payment from list
        setClaimablePayments(prev => prev.filter(p => p.id !== payment.id));
        
        // Notify parent component
        if (onPaymentClaimed) {
          onPaymentClaimed(payment);
        }
      } else {
        throw new Error(data.message || 'Claim failed');
      }
      
    } catch (error: any) {
      console.error('❌ Claim error:', error);
      setScanError(error.message || 'Failed to claim payment');
    } finally {
      setClaimingPayment(null);
    }
  };

  const formatAmount = (amount: number, coinType: string) => {
    return `${amount.toFixed(2)} ${coinType}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (payment: ClaimablePayment) => {
    if (claimingPayment === payment.id) {
      return <RefreshCw size={16} className="spinning" />;
    }
    return <Clock size={16} />;
  };

  return (
    <div className="stealth-scanner-container">
      <div className="scanner-header">
        <div className="scanner-title-section">
          <Shield size={24} className="scanner-icon" />
          <div className="scanner-title">
            <h2>Stealth Payments</h2>
            <p className="scanner-subtitle">
              Private payments sent to your stealth addresses
            </p>
          </div>
        </div>
        
        <div className="scanner-actions">
          <button 
            className={`scan-button ${isScanning ? 'scanning' : ''}`}
            onClick={scanForPayments}
            disabled={isScanning}
          >
            <Search size={16} />
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </button>
          
          {lastScanTime && (
            <div className="last-scan">
              Last scan: {lastScanTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {scanError && (
        <div className="scan-error">
          <AlertCircle size={16} />
          <span>{scanError}</span>
          <button onClick={() => setScanError(null)}>×</button>
        </div>
      )}

      <div className="payments-section">
        {claimablePayments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Shield size={48} />
            </div>
            <h3>No Stealth Payments Found</h3>
            <p>
              {isScanning 
                ? 'Scanning for payments...' 
                : 'No private payments have been sent to your stealth addresses yet.'
              }
            </p>
          </div>
        ) : (
          <div className="payments-list">
            {claimablePayments.map((payment) => (
              <div key={payment.id} className="payment-card">
                <div className="payment-header">
                  <div className="payment-info">
                    <div className="payment-amount">
                      <DollarSign size={20} />
                      <span className="amount">{formatAmount(payment.amount, payment.coinType)}</span>
                    </div>
                    <div className="payment-meta">
                      <span className="payment-id">Payment #{payment.paymentId}</span>
                      <span className="payment-date">{formatDate(payment.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="payment-status">
                    {getStatusIcon(payment)}
                    <span>Pending Claim</span>
                  </div>
                </div>

                <div className="payment-details">
                  <div className="detail-row">
                    <span className="detail-label">Stealth Address:</span>
                    <code className="detail-value">
                      {payment.stealthAddress.slice(0, 20)}...{payment.stealthAddress.slice(-8)}
                    </code>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Transaction:</span>
                    <code className="detail-value">
                      {payment.txHash.slice(0, 20)}...{payment.txHash.slice(-8)}
                    </code>
                  </div>

                  {showPrivateKeys && payment.ephemeralPublicKey && (
                    <div className="detail-row">
                      <span className="detail-label">Ephemeral Key:</span>
                      <code className="detail-value">
                        {payment.ephemeralPublicKey.slice(0, 20)}...
                      </code>
                    </div>
                  )}
                </div>

                <div className="payment-actions">
                  <button 
                    className="toggle-keys-button"
                    onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                  >
                    {showPrivateKeys ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showPrivateKeys ? 'Hide Keys' : 'Show Keys'}
                  </button>
                  
                  <button 
                    className={`claim-button ${claimingPayment === payment.id ? 'claiming' : ''}`}
                    onClick={() => claimPayment(payment)}
                    disabled={claimingPayment === payment.id}
                  >
                    {claimingPayment === payment.id ? (
                      <>
                        <RefreshCw size={16} className="spinning" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Claim Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="scanner-footer">
        <div className="privacy-notice">
          <Shield size={16} />
          <span>
            Stealth payments are private and cannot be traced to your real wallet address.
          </span>
        </div>
        
        <div className="scan-info">
          <span>Auto-scanning every 30 seconds</span>
        </div>
      </div>
    </div>
  );
};

export default StealthScanner;
