import React from 'react';

interface WalletDebugProps {
  isConnected: boolean;
  isSignedIn: boolean;
  account: string | null;
  isLoading: boolean;
  error: string | null;
}

const WalletDebug: React.FC<WalletDebugProps> = ({ 
  isConnected, 
  isSignedIn,
  account, 
  isLoading, 
  error 
}) => {
  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Wallet Debug Info</h4>
      <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
      <div>Signed In: {isSignedIn ? 'Yes' : 'No'}</div>
      <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
      <div>Account: {account || 'None'}</div>
      {error && <div style={{color: 'red'}}>Error: {error}</div>}
      <div>Available Wallets:</div>
      <div>• Pectra: {typeof window !== 'undefined' && (window as any).pectra ? 'Yes' : 'No'}</div>
      <div>• Petra: {typeof window !== 'undefined' && (window as any).aptos ? 'Yes' : 'No'}</div>
    </div>
  );
};

export default WalletDebug;
