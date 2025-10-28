/**
 * Stripe Service Utility
 * Handles Stripe API integration for subscription checking
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Check if a customer exists with the given email
 * @param {string} email - Customer email
 * @returns {Object|null} - Customer object or null if not found
 */
async function findCustomerByEmail(email) {
    try {
        const customers = await stripe.customers.list({
            email: email,
            limit: 1
        });
        
        return customers.data.length > 0 ? customers.data[0] : null;
    } catch (error) {
        console.error('Error finding customer by email:', error);
        throw error;
    }
}

/**
 * Get all subscriptions for a customer
 * @param {string} customerId - Stripe customer ID
 * @returns {Array} - Array of subscription objects
 */
async function getCustomerSubscriptions(customerId) {
    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all', // Get all subscriptions (active, canceled, etc.)
            expand: ['data.items.data.price']
        });
        
        return subscriptions.data;
    } catch (error) {
        console.error('Error getting customer subscriptions:', error);
        throw error;
    }
}

/**
 * Check if user has any active subscription
 * @param {string} email - User email from Auth0
 * @returns {Object} - Subscription status information
 */
async function checkUserSubscriptionStatus(email) {
    try {
        console.log(`🔍 Checking subscription status for email: ${email}`);
        
        // Find customer by email
        const customer = await findCustomerByEmail(email);
        
        if (!customer) {
            console.log(`❌ No Stripe customer found for email: ${email}`);
            return {
                hasActiveSubscription: false,
                customerExists: false,
                email: email,
                message: 'No Stripe account found with this email',
                subscriptions: []
            };
        }
        
        console.log(`✅ Found Stripe customer: ${customer.id}`);
        
        // Get all subscriptions for this customer
        const subscriptions = await getCustomerSubscriptions(customer.id);
        
        // Check for active subscriptions
        const activeSubscriptions = subscriptions.filter(sub => 
            sub.status === 'active' || sub.status === 'trialing'
        );
        
        const hasActiveSubscription = activeSubscriptions.length > 0;
        
        console.log(`📊 Subscription status: ${hasActiveSubscription ? 'ACTIVE' : 'INACTIVE'}`);
        console.log(`   Total subscriptions: ${subscriptions.length}`);
        console.log(`   Active subscriptions: ${activeSubscriptions.length}`);
        
        return {
            hasActiveSubscription,
            customerExists: true,
            email: email,
            customerId: customer.id,
            subscriptions: subscriptions,
            activeSubscriptions: activeSubscriptions,
            message: hasActiveSubscription 
                ? `Active subscription found (${activeSubscriptions.length} active)`
                : 'No active subscription found'
        };
        
    } catch (error) {
        console.error('Error checking subscription status:', error);
        return {
            hasActiveSubscription: false,
            customerExists: false,
            email: email,
            error: error.message,
            message: 'Error checking subscription status'
        };
    }
}

/**
 * Get subscription details for display
 * @param {Array} activeSubscriptions - Array of active subscriptions
 * @returns {Object} - Formatted subscription details
 */
function formatSubscriptionDetails(activeSubscriptions) {
    if (!activeSubscriptions || activeSubscriptions.length === 0) {
        return null;
    }
    
    const subscription = activeSubscriptions[0]; // Get first active subscription
    const price = subscription.items.data[0]?.price;
    
    return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        price: price ? {
            amount: price.unit_amount,
            currency: price.currency,
            interval: price.recurring?.interval,
            intervalCount: price.recurring?.interval_count
        } : null
    };
}

/**
 * Check if email domains match (basic validation)
 * @param {string} auth0Email - Email from Auth0
 * @param {string} stripeEmail - Email from Stripe
 * @returns {boolean} - True if domains match
 */
function validateEmailDomain(auth0Email, stripeEmail) {
    if (!auth0Email || !stripeEmail) return false;
    
    const auth0Domain = auth0Email.split('@')[1]?.toLowerCase();
    const stripeDomain = stripeEmail.split('@')[1]?.toLowerCase();
    
    return auth0Domain === stripeDomain;
}

module.exports = {
    findCustomerByEmail,
    getCustomerSubscriptions,
    checkUserSubscriptionStatus,
    formatSubscriptionDetails,
    validateEmailDomain
};
