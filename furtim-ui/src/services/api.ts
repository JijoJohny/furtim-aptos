// API service for backend communication
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface User {
  id: string;
  username: string;
  wallet_address: string;
  public_key?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string;
}

export interface WalletAuthRequest {
  wallet_address: string;
  signature: string;
  message: string;
  timestamp: number;
}

export interface WalletAuthResponse {
  success: boolean;
  is_new_user: boolean;
  user?: User;
  session_token?: string;
  message: string;
}

export interface UserRegistrationRequest {
  username: string;
  pin: string;
  wallet_address: string;
  signature: string;
  public_key?: string;
  meta_keys?: {
    scanPrivateKey: number[];
    scanPublicKey: number[];
    spendPrivateKey: number[];
    spendPublicKey: number[];
  };
}

export interface UserRegistrationResponse {
  success: boolean;
  user?: User;
  session_token?: string;
  message: string;
}

export interface PinVerificationRequest {
  session_token: string;
  pin: string;
  wallet_signature?: string;
  wallet_message?: string;
  wallet_address?: string;
}

export interface PinVerificationResponse {
  success: boolean;
  user?: User;
  message: string;
}

export interface UsernameCheckRequest {
  username: string;
}

export interface UsernameCheckResponse {
  success: boolean;
  is_available: boolean;
  message: string;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('session_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    
    if (!response.ok) {
      // Include validation errors if available
      const errorMessage = data.errors && data.errors.length > 0 
        ? `${data.message}: ${data.errors.map((e: any) => e.msg).join(', ')}`
        : data.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return data;
  }

  /**
   * Authenticate user with wallet signature
   */
  async authenticateWallet(request: WalletAuthRequest): Promise<WalletAuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    return this.handleResponse<WalletAuthResponse>(response);
  }

  /**
   * Register new user
   */
  async registerUser(request: UserRegistrationRequest): Promise<UserRegistrationResponse> {
    console.log('🌐 API Service: Making registration request...');
    console.log('📡 Request URL:', `${API_BASE_URL}/auth/register`);
    console.log('📦 Request payload:', {
      ...request,
      pin: '[REDACTED]',
      signature: request.signature ? 'Present' : 'Missing',
      meta_keys: request.meta_keys ? 'Present' : 'Missing'
    });
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    console.log('📨 API Service: Received response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    return this.handleResponse<UserRegistrationResponse>(response);
  }

  /**
   * Verify PIN for returning user
   */
  async verifyPin(request: PinVerificationRequest): Promise<PinVerificationResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    return this.handleResponse<PinVerificationResponse>(response);
  }

  /**
   * Check username availability
   */
  async checkUsername(request: UsernameCheckRequest): Promise<UsernameCheckResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/check-username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    return this.handleResponse<UsernameCheckResponse>(response);
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<{ success: boolean; user: User; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<{ success: boolean; user: User; message: string }>(response);
  }

  /**
   * Logout user
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<{ success: boolean; message: string }>(response);
  }

  /**
   * Store session token
   */
  setSessionToken(token: string): void {
    localStorage.setItem('session_token', token);
  }

  /**
   * Get session token
   */
  getSessionToken(): string | null {
    return localStorage.getItem('session_token');
  }

  /**
   * Clear session
   */
  clearSession(): void {
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_data');
  }

  /**
   * Store user data
   */
  setUserData(user: User): void {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  /**
   * Get user data
   */
  getUserData(): User | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getSessionToken();
  }
}

export const apiService = new ApiService();
export default apiService;
