import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import ConnectWallet from './components/ConnectWallet';
import UsernameSetup from './components/UsernameSetup';
import PinSetup from './components/PinSetup';
import PinVerification from './components/PinVerification';
import HomeDashboard from './components/HomeDashboard';
import LinksPage from './components/LinksPage';
import WalletInstallPrompt from './components/WalletInstallPrompt';
import WalletDebug from './components/WalletDebug';
import { AptosWalletProvider, useAptosWallet } from './providers/AptosWalletProvider';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import './App.css';

function AppContent() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [showLinksPage, setShowLinksPage] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [newLink, setNewLink] = useState<any>(null);
  const [pendingUsername, setPendingUsername] = useState<string>('');
  const [pendingWalletAuth, setPendingWalletAuth] = useState<{
    walletAddress: string;
    signature: string;
    message: string;
  } | null>(null);
  
  const { 
    isConnected, 
    isSignedIn,
    account, 
    isLoading: walletLoading, 
    error: walletError, 
    connect,
    signMessage
  } = useAptosWallet();

  const { 
    user, 
    isAuthenticated, 
    isLoading: authLoading, 
    error: authError,
    isNewUser,
    authenticateWallet,
    clearError
  } = useAuth();
  
  // Check if user is authenticated and redirect accordingly
  React.useEffect(() => {
    if (isAuthenticated && user) {
      setShowDashboard(true);
      setShowUsernameSetup(false);
      setShowPinSetup(false);
      setShowPinVerification(false);
      setShowLinksPage(false);
    }
  }, [isAuthenticated, user]);

  // Handle authentication response
  React.useEffect(() => {
    if (isNewUser && pendingWalletAuth) {
      // New user - show username setup
      setShowUsernameSetup(true);
      setShowPinVerification(false);
    } else if (!isNewUser && !isAuthenticated && pendingWalletAuth) {
      // Returning user - show PIN verification
      setShowPinVerification(true);
      setShowUsernameSetup(false);
    }
  }, [isNewUser, isAuthenticated, pendingWalletAuth]);

  const handleCloseDashboard = () => {
    setShowDashboard(false);
  };

  const handleConnectWallet = async () => {
    if (isSignedIn && account) {
      // If wallet is connected and signed in, authenticate with backend
      try {
        const signature = await signMessage('Authenticate with Furtim');
        if (signature) {
          setPendingWalletAuth({
            walletAddress: account,
            signature,
            message: 'Authenticate with Furtim'
          });
          await authenticateWallet(account, signature, 'Authenticate with Furtim');
        }
      } catch (error: any) {
        console.error('Failed to sign message:', error);
      }
      return;
    }

    if (isConnected && !isSignedIn) {
      // If wallet is connected but not signed in, sign message
      try {
        const signature = await signMessage('Authenticate with Furtim');
        if (signature && account) {
          setPendingWalletAuth({
            walletAddress: account,
            signature,
            message: 'Authenticate with Furtim'
          });
          await authenticateWallet(account, signature, 'Authenticate with Furtim');
        }
      } catch (error: any) {
        console.error('Failed to sign message:', error);
      }
      return;
    }

    // If wallet is not connected, connect first
    try {
      await connect();
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      if (err.message && err.message.includes('not found')) {
        setShowInstallPrompt(true);
      }
    }
  };

  const handleUsernameSet = (newUsername: string) => {
    setPendingUsername(newUsername);
    setShowUsernameSetup(false);
    setShowPinSetup(true);
    console.log('Username set:', newUsername);
  };

  const handleBackToConnect = () => {
    setShowUsernameSetup(false);
  };

  const handlePinVerificationBack = () => {
    setShowPinVerification(false);
    setPendingWalletAuth(null);
  };

  const handleBackToUsername = () => {
    setShowPinSetup(false);
    setShowUsernameSetup(true);
  };

  const handleCreateLinkSubmit = (linkData: any) => {
    console.log('Creating link:', linkData);
    
    // Create a new link object
    const newLinkData = {
      id: Date.now().toString(),
      title: linkData.name,
      slug: linkData.slug,
      amountType: linkData.amountType,
      fixedAmount: linkData.fixedAmount,
      description: linkData.description,
      createdAt: new Date().toISOString(),
      isNew: true
    };
    
    setNewLink(newLinkData);
    setShowLinksPage(true);
  };

  const handleCreateLink = () => {
    setShowLinksPage(false);
    // This would open the create link modal
    // For now, we'll just show the home dashboard
    setShowDashboard(true);
  };

  const handleTabChange = (tab: 'home' | 'links' | 'create') => {
    if (tab === 'home') {
      setShowLinksPage(false);
      setShowDashboard(true);
    } else if (tab === 'links') {
      setShowDashboard(false);
      setShowLinksPage(true);
    } else if (tab === 'create') {
      // Handle create link - this would open the modal
      setShowLinksPage(false);
      setShowDashboard(true);
    }
  };

  // Show PIN setup page for new user registration
  if (showPinSetup && pendingWalletAuth) {
    return (
      <PinSetup 
        onBack={handleBackToUsername}
        username={pendingUsername}
        walletAddress={pendingWalletAuth.walletAddress}
        signature={pendingWalletAuth.signature}
      />
    );
  }

  // Show PIN verification page for returning users
  if (showPinVerification && user) {
    return (
      <PinVerification 
        onBack={handlePinVerificationBack}
        username={user.username}
      />
    );
  }

  // Show username setup page for new users
  if (showUsernameSetup && isConnected) {
    return (
      <UsernameSetup 
        onUsernameSet={handleUsernameSet}
        onBack={handleBackToConnect}
        walletAddress={account}
      />
    );
  }

  // Show links page if links page is shown
  if (showLinksPage && user) {
    return (
      <LinksPage 
        username={user.username}
        walletAddress={user.wallet_address}
        newLink={newLink}
        onCreateLink={handleCreateLink}
        onTabChange={handleTabChange}
      />
    );
  }

  // Show home dashboard if user is authenticated
  if (showDashboard && user) {
    return (
      <HomeDashboard 
        username={user.username}
        walletAddress={user.wallet_address}
        onCreateLink={handleCreateLinkSubmit}
        onTabChange={handleTabChange}
      />
    );
  }

  return (
    <div className="App">
      {/* Floating Background Shapes */}
      <div className="floating-shapes">
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
      </div>
      
      <Dashboard 
        onClose={handleCloseDashboard}
        showCloseButton={showDashboard}
        isWalletConnected={isConnected}
        walletAddress={account}
      />
      <ConnectWallet 
        onConnectWallet={handleConnectWallet}
        isWalletConnected={isConnected}
        isSignedIn={isSignedIn}
        isConnecting={walletLoading}
        walletError={walletError}
      />
      
      {showInstallPrompt && (
        <WalletInstallPrompt onClose={() => setShowInstallPrompt(false)} />
      )}
      
      <WalletDebug 
        isConnected={isConnected}
        isSignedIn={isSignedIn}
        account={account}
        isLoading={walletLoading}
        error={walletError}
      />
    </div>
  );
}

function App() {
  return (
    <AptosWalletProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AptosWalletProvider>
  );
}

export default App;

