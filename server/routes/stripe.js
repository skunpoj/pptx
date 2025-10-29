/**
 * Stripe Routes
 * Handles subscription checking and related Stripe operations
 */

const express = require('express');
const router = express.Router();
const { 
    checkUserSubscriptionStatus, 
    formatSubscriptionDetails,
    createPromptPayCheckoutSession,
    createCreditCardSubscriptionSession,
    createPromptPayPaymentSession,
    createPromptPayPaymentIntent
} = require('../utils/stripeService');

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

/**
 * POST /api/creditcard/subscription
 * Create credit card subscription checkout session with automatic recurring billing
 * Requires authentication
 */
router.post('/api/creditcard/subscription', async (req, res) => {
  if (!req.oidc.isAuthenticated() || !req.oidc.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const userEmail = req.oidc.user.email;
    const { amount = 19900, interval = 'month', productName, description } = req.body;
    
    const subscriptionData = {
      amount: parseInt(amount),
      interval,
      productName: productName || 'GENIS.AI Subscription',
      description: description || 'AI-powered presentation generation service',
      productId: 'prod_TJiubB9Eq7c68h' // Active product ID
    };
    
    const session = await createCreditCardSubscriptionSession(userEmail, subscriptionData);
    
    res.json({
      sessionId: session.id,
      url: session.url,
      message: 'Credit card subscription will auto-renew monthly.'
    });
  } catch (error) {
    console.error('Error creating credit card subscription:', error);
    res.status(500).json({ 
      error: 'Failed to create credit card subscription',
      message: error.message 
    });
  }
});

/**
 * POST /api/promptpay/subscription
 * Create PromptPay subscription checkout session
 * Requires authentication
 */
router.post('/api/promptpay/subscription', async (req, res) => {
  if (!req.oidc.isAuthenticated() || !req.oidc.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const userEmail = req.oidc.user.email;
    const { amount = 29900, interval = 'month', productName, description } = req.body;
    
    const subscriptionData = {
      amount: parseInt(amount),
      interval,
      productName: productName || 'GENIS.AI Subscription',
      description: description || 'AI-powered presentation generation service',
      productId: 'prod_TJiubB9Eq7c68h' // Active product ID
    };
    
    const session = await createPromptPayCheckoutSession(userEmail, subscriptionData);
    
    res.json({
      sessionId: session.id,
      url: session.url,
      warning: 'PromptPay is single-use. This is a one-time payment for premium access.'
    });
  } catch (error) {
    console.error('Error creating PromptPay subscription:', error);
    res.status(500).json({ 
      error: 'Failed to create PromptPay subscription',
      message: error.message 
    });
  }
});

/**
 * POST /api/promptpay/payment
 * Create PromptPay one-time payment session
 * Requires authentication
 */
router.post('/api/promptpay/payment', async (req, res) => {
  if (!req.oidc.isAuthenticated() || !req.oidc.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const userEmail = req.oidc.user.email;
    const { amount = 9900, productName, description, quantity = 1 } = req.body;
    
    const paymentData = {
      amount: parseInt(amount),
      productName: productName || 'GENIS.AI Service',
      description: description || 'AI-powered presentation generation',
      quantity: parseInt(quantity)
    };
    
    const session = await createPromptPayPaymentSession(userEmail, paymentData);
    
    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating PromptPay payment:', error);
    res.status(500).json({ 
      error: 'Failed to create PromptPay payment',
      message: error.message 
    });
  }
});

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhooks for subscription events
 */
router.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log(`💳 Payment failed for invoice: ${failedInvoice.id}`);
      console.log(`   Customer: ${failedInvoice.customer}`);
      console.log(`   Amount: ${failedInvoice.amount_due} ${failedInvoice.currency}`);
      
      // Here you could send a custom email notification
      // or update your database with payment failure info
      break;
      
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log(`🔄 Subscription updated: ${subscription.id}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Customer: ${subscription.customer}`);
      
      if (subscription.status === 'past_due') {
        console.log(`⚠️  Subscription is past due - customer needs to renew`);
      } else if (subscription.status === 'active') {
        console.log(`✅ Subscription reactivated`);
      }
      break;
      
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log(`❌ Subscription cancelled: ${deletedSubscription.id}`);
      console.log(`   Customer: ${deletedSubscription.customer}`);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

module.exports = router;
