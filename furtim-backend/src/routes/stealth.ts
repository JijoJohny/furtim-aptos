import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { stealthClaimService } from '../services/stealthClaimService';
import { stealthIndexer } from '../services/stealthIndexer';

const router = Router();

/**
 * GET /stealth/scan
 * Scan for claimable payments for the authenticated user
 */
router.get('/scan', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    
    console.log(`🔍 Scanning for claimable payments for user: ${userId}`);
    
    const claimablePayments = await stealthClaimService.scanForClaimablePayments(userId);
    
    res.status(200).json({
      success: true,
      data: claimablePayments,
      message: `Found ${claimablePayments.length} claimable payments`
    });
  } catch (error) {
    console.error('Stealth scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan for claimable payments'
    });
  }
});

/**
 * POST /stealth/claim
 * Claim a stealth payment
 */
router.post('/claim', [
  authenticateToken,
  body('paymentId').isNumeric(),
  body('stealthAddress').isString().notEmpty(),
  body('ephemeralPublicKey').isString().notEmpty(),
  body('sharedSecretProof').isString().notEmpty()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { paymentId, stealthAddress, ephemeralPublicKey, sharedSecretProof } = req.body;

    console.log(`🎯 Claiming payment ${paymentId} for user ${userId}`);

    const claimRequest = {
      userId,
      paymentId,
      stealthAddress,
      ephemeralPublicKey,
      sharedSecretProof
    };

    const result = await stealthClaimService.claimPayment(claimRequest);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          txHash: result.txHash,
          claimedAmount: result.claimedAmount
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Stealth claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim payment'
    });
  }
});

/**
 * GET /stealth/balance
 * Get user's stealth balance
 */
router.get('/balance', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    
    const balance = await stealthClaimService.getUserStealthBalance(userId);
    
    res.status(200).json({
      success: true,
      data: {
        balance,
        currency: 'USDC'
      },
      message: 'Stealth balance retrieved successfully'
    });
  } catch (error) {
    console.error('Stealth balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stealth balance'
    });
  }
});

/**
 * GET /stealth/history
 * Get user's stealth transaction history
 */
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    
    const history = await stealthClaimService.getUserStealthHistory(userId);
    
    res.status(200).json({
      success: true,
      data: history,
      message: 'Stealth history retrieved successfully'
    });
  } catch (error) {
    console.error('Stealth history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stealth history'
    });
  }
});

/**
 * GET /stealth/indexer/status
 * Get indexer status
 */
router.get('/indexer/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = await stealthIndexer.getIndexerStatus();
    
    res.status(200).json({
      success: true,
      data: status,
      message: 'Indexer status retrieved successfully'
    });
  } catch (error) {
    console.error('Indexer status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get indexer status'
    });
  }
});

/**
 * POST /stealth/indexer/start
 * Start the stealth indexer
 */
router.post('/indexer/start', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await stealthIndexer.start();
    
    res.status(200).json({
      success: true,
      message: 'Stealth indexer started successfully'
    });
  } catch (error) {
    console.error('Indexer start error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start indexer'
    });
  }
});

/**
 * POST /stealth/indexer/stop
 * Stop the stealth indexer
 */
router.post('/indexer/stop', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await stealthIndexer.stop();
    
    res.status(200).json({
      success: true,
      message: 'Stealth indexer stopped successfully'
    });
  } catch (error) {
    console.error('Indexer stop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop indexer'
    });
  }
});

export default router;
