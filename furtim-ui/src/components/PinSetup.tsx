import React, { useState, useRef, useEffect } from 'react';
import { Key, Lock, Shield } from 'lucide-react';
import Dashboard from './Dashboard';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '../providers/AuthProvider';
import { stealthAddressService } from '../services/stealthAddressService';

interface PinSetupProps {
  onBack: () => void;
  username: string;
  walletAddress: string;
  signature: string;
}

const PinSetup: React.FC<PinSetupProps> = ({ onBack, username, walletAddress, signature }) => {
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [isCreating, setIsCreating] = useState(false);
  const [metaKeysGenerated, setMetaKeysGenerated] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { registerUser, error, clearError } = useAuth();

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handlePinChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return;
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCreateMetaKeys = async () => {
    console.log('🚀 Create Meta Keys button clicked');
    console.log('📊 Current state:', {
      pin: pin,
      pinString: pin.join(''),
      isCreating,
      metaKeysGenerated,
      username,
      walletAddress,
      signature: signature ? 'Present' : 'Missing'
    });
    
    const pinString = pin.join('');
    console.log('🔢 PIN string:', pinString, 'Length:', pinString.length);
    
    if (pinString.length !== 4) {
      console.log('❌ PIN not complete, length:', pinString.length);
      alert(`PIN not complete. Current length: ${pinString.length}. Please enter 4 digits.`);
      return;
    }

    console.log('✅ PIN is complete, starting meta key generation...');
    setIsCreating(true);
    clearError();
    
    try {
      // Generate meta keys for stealth addresses
      console.log('🔑 Generating meta keys for stealth addresses...');
      console.log('📝 Input parameters:', { pinString, signature: signature ? 'Present' : 'Missing' });
      
      const metaKeys = await stealthAddressService.generateMetaKeys(pinString, signature);
      console.log('✅ Meta keys generated successfully:', {
        scanPublicKey: Array.from(metaKeys.scanPublicKey).slice(0, 8),
        spendPublicKey: Array.from(metaKeys.spendPublicKey).slice(0, 8),
        scanPrivateKeyLength: metaKeys.scanPrivateKey.length,
        spendPrivateKeyLength: metaKeys.spendPrivateKey.length
      });
      
      // Validate meta keys
      console.log('🔍 Validating meta keys...');
      const isValid = await stealthAddressService.validateMetaKeys(metaKeys);
      if (!isValid) {
        throw new Error('Generated meta keys are invalid');
      }
      console.log('✅ Meta keys validation passed');
      
      setMetaKeysGenerated(true);
      console.log('🎉 Meta keys generated and validated successfully!');

      // Register user with meta keys
      console.log('📤 Starting user registration with meta keys...');
      console.log('📋 Registration data:', {
        username,
        walletAddress,
        signature: signature ? 'Present' : 'Missing',
        metaKeysPresent: true
      });
      
      await registerUser(username, pinString, walletAddress, signature, undefined, {
        scanPrivateKey: Array.from(metaKeys.scanPrivateKey),
        scanPublicKey: Array.from(metaKeys.scanPublicKey),
        spendPrivateKey: Array.from(metaKeys.spendPrivateKey),
        spendPublicKey: Array.from(metaKeys.spendPublicKey)
      });
      
      console.log('🎊 User registration completed successfully!');
    } catch (error: any) {
      console.error('❌ Failed to generate meta keys or register user:', error);
      console.error('📊 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setMetaKeysGenerated(false);
      // Show error to user
      alert(`Error: ${error.message || 'Failed to create meta keys. Please try again.'}`);
    } finally {
      console.log('🏁 Meta key creation process finished');
      setIsCreating(false);
    }
  };

  const isPinComplete = pin.every(digit => digit !== '');

  return (
    <div className="pin-setup-container">
      {/* Header */}
      <Dashboard 
        onClose={onBack}
        showCloseButton={true}
        isWalletConnected={true}
        walletAddress={username}
      />

      {/* Main Content */}
      <div className="pin-setup-main-content">
        <div className="pin-setup-card">
          <div className="pin-setup-icon">
            <Key size={32} />
          </div>
          
          <h1 className="pin-setup-title">Set Your PIN</h1>
          
          <p className="pin-setup-description">
            Create a secure 4-digit PIN to protect your meta keys. Your PIN is used to generate 
            deterministic stealth address keys that enable private payments.
          </p>

          {metaKeysGenerated && (
            <div className="meta-keys-success">
              <Shield size={20} />
              <span>Stealth address meta keys generated successfully!</span>
            </div>
          )}

          {error && (
            <div className="pin-setup-error">
              <span>{error}</span>
            </div>
          )}
          
          <div className="pin-setup-inputs">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="pin-setup-input"
                placeholder="•"
              />
            ))}
          </div>
          
          <button 
            className={`pin-setup-button ${!isPinComplete || isCreating ? 'disabled' : ''}`}
            onClick={(e) => {
              console.log('🖱️ Button clicked!', {
                isPinComplete,
                isCreating,
                disabled: !isPinComplete || isCreating
              });
              handleCreateMetaKeys();
            }}
            disabled={!isPinComplete || isCreating}
          >
            <Lock size={16} />
            {isCreating ? 'Generating Stealth Keys...' : 'Create Meta Keys'}
          </button>
        </div>
      </div>

        {/* Navigation */}
        <BottomNavigation activeTab="home" />
    </div>
  );
};

export default PinSetup;

// Add styles for error display
const styles = `
  .pin-setup-error {
    background: #fee2e2;
    border: 1px solid #fca5a5;
    border-radius: 8px;
    padding: 12px;
    margin: 16px 0;
    color: #dc2626;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .meta-keys-success {
    background: #dcfce7;
    border: 1px solid #86efac;
    border-radius: 8px;
    padding: 12px;
    margin: 16px 0;
    color: #166534;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
