import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class WalletErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a wallet injection error
    if (error.message && error.message.includes('ethereum')) {
      return {
        hasError: true,
        errorMessage: 'Wallet injection error detected and suppressed. Only Aptos wallets are supported.'
      };
    }
    
    // For other errors, let them bubble up normally
    return { hasError: false, errorMessage: '' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log wallet injection errors but don't crash the app
    if (error.message && error.message.includes('ethereum')) {
      console.warn('Caught and suppressed Ethereum wallet injection error:', error);
      console.warn('Error info:', errorInfo);
      
      // Reset error state after a short delay
      setTimeout(() => {
        this.setState({ hasError: false, errorMessage: '' });
      }, 100);
      
      return;
    }
    
    // For other errors, log them normally
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Don't show UI for wallet injection errors, just suppress them
      return this.props.children;
    }

    return this.props.children;
  }
}

export default WalletErrorBoundary;
