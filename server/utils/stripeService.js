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
 * Check if user has any active subscription (including different email variations)
 * @param {string} email - User email from Auth0
 * @returns {Object} - Subscription status information
 */
async function checkUserSubscriptionStatus(email) {
    try {
        console.log(`🔍 Checking subscription status for email: ${email}`);
        
        // First, try exact email match
        let customer = await findCustomerByEmail(email);
        let exactMatch = !!customer;
        
        // If no exact match, try common email variations
        if (!customer) {
            console.log(`❌ No exact match for ${email}, trying variations...`);
            
            // Try common email variations
            const emailVariations = generateEmailVariations(email);
            
            for (const variation of emailVariations) {
                customer = await findCustomerByEmail(variation);
                if (customer) {
                    console.log(`✅ Found customer with email variation: ${variation}`);
                    break;
                }
            }
        }
        
        if (!customer) {
            console.log(`❌ No Stripe customer found for email: ${email}`);
            return {
                hasActiveSubscription: false,
                customerExists: false,
                email: email,
                exactEmailMatch: false,
                message: 'No Stripe account found with this email or common variations',
                subscriptions: [],
                emailMismatchWarning: true
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
        console.log(`   Exact email match: ${exactMatch}`);
        
        return {
            hasActiveSubscription,
            customerExists: true,
            email: email,
            customerId: customer.id,
            exactEmailMatch: exactMatch,
            subscriptions: subscriptions,
            activeSubscriptions: activeSubscriptions,
            emailMismatchWarning: !exactMatch,
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
            exactEmailMatch: false,
            error: error.message,
            message: 'Error checking subscription status',
            emailMismatchWarning: true
        };
    }
}

/**
 * Generate common email variations for matching
 * @param {string} email - Original email
 * @returns {Array} - Array of email variations
 */
function generateEmailVariations(email) {
    const variations = [];
    const [localPart, domain] = email.split('@');
    
    if (!localPart || !domain) return variations;
    
    // Common variations
    variations.push(`${localPart}+stripe@${domain}`); // Gmail plus addressing
    variations.push(`${localPart}.stripe@${domain}`); // Gmail dot variations
    variations.push(`${localPart}_stripe@${domain}`); // Underscore variations
    
    // Try without dots in local part (Gmail behavior)
    const noDotsLocal = localPart.replace(/\./g, '');
    if (noDotsLocal !== localPart) {
        variations.push(`${noDotsLocal}@${domain}`);
    }
    
    // Try common alternative domains
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    if (commonDomains.includes(domain.toLowerCase())) {
        commonDomains.forEach(altDomain => {
            if (altDomain !== domain.toLowerCase()) {
                variations.push(`${localPart}@${altDomain}`);
            }
        });
    }
    
    return variations;
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
    validateEmailDomain,
    createPromptPayCheckoutSession,
    createPromptPayPaymentSession,
    createPromptPayPaymentIntent
};
