import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import Dashboard from './Dashboard';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '../providers/AuthProvider';

interface UsernameSetupProps {
  onUsernameSet: (username: string) => void;
  onBack: () => void;
  walletAddress?: string | null;
}

const UsernameSetup: React.FC<UsernameSetupProps> = ({ 
  onUsernameSet, 
  onBack, 
  walletAddress 
}) => {
  const [username, setUsername] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { checkUsername: checkUsernameAvailability, error: authError, clearError } = useAuth();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setUsername(value);
    setError(null);
    clearError();
  };

  const validateUsername = async (username: string): Promise<boolean> => {
    if (!username) {
      setError('Username is required');
      return false;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }

    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return false;
    }

    if (!/^[a-z0-9-]+$/.test(username)) {
      setError('Username can only contain lowercase letters, numbers, and hyphens');
      return false;
    }

    if (username.startsWith('-') || username.endsWith('-')) {
      setError('Username cannot start or end with a hyphen');
      return false;
    }

    // Simulate API call to check availability
    setIsValidating(true);
    try {
      // Check availability via backend API
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setError('Username is already taken');
        return false;
      }
      
      return true;
    } catch (err) {
      setError(authError || 'Failed to check username availability');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateUsername(username);
    if (isValid) {
      onUsernameSet(username);
    }
  };

  const handleSuggestUsername = () => {
    // Generate a random username suggestion
    const adjectives = ['cool', 'smart', 'fast', 'bright', 'happy', 'lucky', 'bold', 'wise'];
    const nouns = ['user', 'trader', 'builder', 'creator', 'explorer', 'pioneer', 'master', 'genius'];
    const numbers = Math.floor(Math.random() * 999) + 1;
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const suggestion = `${adjective}-${noun}-${numbers}`;
    
    setUsername(suggestion);
    setError(null);
  };

  return (
    <div className="username-setup-container">
      {/* Floating Background Shapes */}
      <div className="floating-shapes">
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
      </div>

      {/* Header */}
      <Dashboard 
        onClose={onBack}
        showCloseButton={true}
        isWalletConnected={!!walletAddress}
        walletAddress={walletAddress}
      />

      {/* Main Content */}
      <div className="username-main-content">
        <div className="username-card">
          <div className="welcome-section">
            <div className="welcome-title">
              <Sparkles size={32} className="sparkle-icon" />
              <h1>Welcome to Furtim!</h1>
              <span className="wave-emoji">👋</span>
            </div>
            <p className="welcome-description">
              To get started, you'll need to set up your username. This will help others find and pay you easily while keeping your real wallet address private.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="username-form">
            <div className="username-input-container">
              <div className="username-prefix">furtim.me/</div>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Enter your username"
                className={`username-input ${error ? 'error' : ''}`}
                disabled={isValidating}
              />
            </div>
            
            {error && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <span>{error}</span>
              </div>
            )}

            <button 
              type="button" 
              className="suggest-button"
              onClick={handleSuggestUsername}
              disabled={isValidating}
            >
              💡 Choose a username
            </button>

            <button 
              type="submit" 
              className="setup-button"
              disabled={!username || isValidating}
            >
              <span>Set Up Your Username</span>
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Footer Navigation */}
      <BottomNavigation activeTab="home" />
    </div>
  );
};

export default UsernameSetup;
