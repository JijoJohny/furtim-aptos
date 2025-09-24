export interface User {
  id: string;
  username: string;
  wallet_address: string;
  pin_hash: string;
  public_key?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  wallet_signature: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  last_activity: string;
}

export interface WalletAuthRequest {
  wallet_address: string;
  signature: string;
  message: string;
  timestamp: number;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session_token?: string;
  is_new_user: boolean;
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
