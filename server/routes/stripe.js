/**
 * Stripe Routes
 * Handles subscription checking and related Stripe operations
 */

const express = require('express');
const router = express.Router();
const { checkUserSubscriptionStatus, formatSubscriptionDetails } = require('../utils/stripeService');

/**
 * GET /api/subscription
 * Check user subscription status
 * Requires authentication
 */
router.get('/api/subscription', async (req, res) => {
  if (!req.oidc.isAuthenticated() || !req.oidc.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const userEmail = req.oidc.user.email;
    const subscriptionStatus = await checkUserSubscriptionStatus(userEmail);
    
    // Format subscription details if active subscription exists
    if (subscriptionStatus.hasActiveSubscription) {
      subscriptionStatus.subscriptionDetails = formatSubscriptionDetails(subscriptionStatus.activeSubscriptions);
    }
    
    res.json(subscriptionStatus);
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ 
      error: 'Failed to check subscription status',
      message: error.message 
    });
  }
});

module.exports = router;
