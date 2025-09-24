import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import apiService, { User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isNewUser: boolean;
  
  // Authentication methods
  authenticateWallet: (walletAddress: string, signature: string, message: string) => Promise<void>;
  registerUser: (username: string, pin: string, walletAddress: string, signature: string, publicKey?: string, metaKeys?: {
    scanPrivateKey: number[];
    scanPublicKey: number[];
    spendPrivateKey: number[];
    spendPublicKey: number[];
  }) => Promise<void>;
  verifyPin: (pin: string, walletSignature?: string, walletMessage?: string, walletAddress?: string) => Promise<void>;
  checkUsername: (username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Session management
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const userData = apiService.getUserData();
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Try to refresh user data
            await refreshUser();
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          apiService.clearSession();
        }
      }
    };

    checkExistingSession();
  }, []);

  const authenticateWallet = async (walletAddress: string, signature: string, message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const response = await apiService.authenticateWallet({
        wallet_address: walletAddress,
        signature,
        message,
        timestamp
      });

      if (response.success) {
        if (response.is_new_user) {
          setIsNewUser(true);
          if (response.session_token) {
            apiService.setSessionToken(response.session_token);
          }
        } else {
          setIsNewUser(false);
          if (response.user && response.session_token) {
            setUser(response.user);
            setIsAuthenticated(true);
            apiService.setSessionToken(response.session_token);
            apiService.setUserData(response.user);
          }
        }
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (username: string, pin: string, walletAddress: string, signature: string, publicKey?: string, metaKeys?: {
    scanPrivateKey: number[];
    scanPublicKey: number[];
    spendPrivateKey: number[];
    spendPublicKey: number[];
  }) => {
    console.log('🔄 AuthProvider: Starting user registration...');
    console.log('📋 Registration parameters:', {
      username,
      walletAddress,
      signature: signature ? 'Present' : 'Missing',
      publicKey: publicKey ? 'Present' : 'Missing',
      metaKeys: metaKeys ? 'Present' : 'Missing'
    });
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('📤 AuthProvider: Calling API service...');
      const response = await apiService.registerUser({
        username,
        pin,
        wallet_address: walletAddress,
        signature,
        public_key: publicKey,
        meta_keys: metaKeys
      });
      
      console.log('📥 AuthProvider: Received API response:', response);

      if (response.success && response.user && response.session_token) {
        console.log('✅ AuthProvider: Registration successful, setting user state...');
        setUser(response.user);
        setIsAuthenticated(true);
        setIsNewUser(false);
        apiService.setSessionToken(response.session_token);
        apiService.setUserData(response.user);
        console.log('🎉 AuthProvider: User state updated successfully');
      } else {
        console.log('❌ AuthProvider: Registration failed:', response.message);
        setError(response.message);
      }
    } catch (error: any) {
      console.error('❌ AuthProvider: Registration error:', error);
      setError(error.message || 'Registration failed');
    } finally {
      console.log('🏁 AuthProvider: Registration process finished');
      setIsLoading(false);
    }
  };

  const verifyPin = async (pin: string, walletSignature?: string, walletMessage?: string, walletAddress?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionToken = apiService.getSessionToken();
      if (!sessionToken) {
        throw new Error('No session token found');
      }

      const response = await apiService.verifyPin({
        session_token: sessionToken,
        pin,
        wallet_signature: walletSignature,
        wallet_message: walletMessage,
        wallet_address: walletAddress
      });

      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        setIsNewUser(false);
        apiService.setUserData(response.user);
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      setError(error.message || 'PIN verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsername = async (username: string): Promise<boolean> => {
    try {
      const response = await apiService.checkUsername({ username });
      return response.success && response.is_available;
    } catch (error: any) {
      setError(error.message || 'Username check failed');
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsNewUser(false);
      apiService.clearSession();
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const refreshUser = async () => {
    if (!apiService.isAuthenticated()) {
      return;
    }

    try {
      const response = await apiService.getCurrentUser();
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        apiService.setUserData(response.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      apiService.clearSession();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    isNewUser,
    authenticateWallet,
    registerUser,
    verifyPin,
    checkUsername,
    logout,
    clearError,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
