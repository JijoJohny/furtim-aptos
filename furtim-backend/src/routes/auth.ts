import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/authService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { 
  WalletAuthRequest, 
  PinVerificationRequest, 
  UserRegistrationRequest 
} from '../types/auth';

const router = Router();

/**
 * POST /auth/wallet
 * Authenticate with wallet signature
 */
router.post('/wallet', [
  body('wallet_address').isString().notEmpty(),
  body('signature').isString().notEmpty(),
  body('message').isString().notEmpty(),
  body('timestamp').isNumeric()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const authRequest: WalletAuthRequest = req.body;
    const result = await AuthService.authenticateWallet(authRequest);

    if (result.success) {
      if (result.is_new_user) {
        // New user - return session token for registration
        res.status(200).json({
          success: true,
          is_new_user: true,
          message: 'New user detected - proceed to registration',
          session_token: result.session_token
        });
      } else {
        // Returning user - return user data and session token
        res.status(200).json({
          success: true,
          is_new_user: false,
          user: result.user,
          session_token: result.session_token,
          message: 'Authentication successful'
        });
      }
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Wallet authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /auth/register
 * Register new user
 */
router.post('/register', [
  body('username').isString().isLength({ min: 3, max: 50 }).matches(/^[a-z0-9_-]+$/),
  body('pin').isString().isLength({ min: 4, max: 4 }).isNumeric(),
  body('wallet_address').isString().notEmpty(),
  body('signature').isString().notEmpty(),
  body('public_key').optional().isString()
], async (req: Request, res: Response) => {
  try {
    console.log('Registration request received:', {
      username: req.body.username,
      wallet_address: req.body.wallet_address,
      signature: req.body.signature ? 'Present' : 'Missing',
      meta_keys: req.body.meta_keys ? 'Present' : 'Missing'
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const registrationRequest: UserRegistrationRequest = req.body;
    const result = await AuthService.registerUser(registrationRequest);

    if (result.success) {
      res.status(201).json({
        success: true,
        user: result.user,
        session_token: result.session_token,
        message: 'User registered successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /auth/verify-pin
 * Verify PIN for returning user
 */
router.post('/verify-pin', [
  body('session_token').isString().notEmpty(),
  body('pin').isString().isLength({ min: 4, max: 4 }).isNumeric()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const pinRequest: PinVerificationRequest = req.body;
    const result = await AuthService.verifyPin(pinRequest);

    if (result.success) {
      res.status(200).json({
        success: true,
        user: result.user,
        message: 'PIN verification successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('PIN verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionToken = req.headers.authorization?.split(' ')[1];
    
    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        message: 'Session token required'
      });
    }

    const success = await AuthService.logout(sessionToken);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
      message: 'User info retrieved successfully'
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /auth/check-username
 * Check username availability
 */
router.post('/check-username', [
  body('username').isString().isLength({ min: 3, max: 50 }).matches(/^[a-z0-9_-]+$/)
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username format'
      });
    }

    const { username } = req.body;
    
    // Check if username exists
    const { data: existingUser, error } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    const isAvailable = !existingUser;
    
    res.status(200).json({
      success: true,
      is_available: isAvailable,
      message: isAvailable ? 'Username is available' : 'Username is already taken'
    });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
