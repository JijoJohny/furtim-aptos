import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase';
import { User, UserSession } from '../types/auth';

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: UserSession;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ success: false, message: 'Access token required' });
      return;
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as { sessionId: string; userId: string };
    
    // Get session from database
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('id', decoded.sessionId)
      .eq('user_id', decoded.userId)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      res.status(401).json({ success: false, message: 'Invalid or expired session' });
      return;
    }

    // Check if session is expired
    if (new Date() > new Date(session.expires_at)) {
      // Mark session as inactive
      await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', session.id);

      res.status(401).json({ success: false, message: 'Session expired' });
      return;
    }

    // Get user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    // Update last activity
    await supabaseAdmin
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id);

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    // Try to authenticate, but don't fail if invalid
    await authenticateToken(req, res, next);
  } catch (error) {
    // Continue without authentication
    next();
  }
};
