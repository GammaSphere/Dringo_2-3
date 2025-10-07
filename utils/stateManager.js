/**
 * Enhanced state management utilities
 * Provides robust state transitions, validation, and error recovery
 */

import fns from "../customer_bot/journey/fns.js";
import saveWithRetry from "./saveWithRetry.js";

/**
 * Valid states in the system
 */
export const VALID_STATES = [
    "fresh-start",
    "accepting-terms",
    "choosing-language",
    "giving-phone-number",
    "giving-full-name",
    "none",
    "support",
    "settings",
    "changing-language",
    "explore-products",
    "product-details",
    "product-details-addons",
    "review-cart",
    "select-pickup-time",
    "paying-for-order",
    "waiting-for-order",
    "banned"
];

/**
 * State transition rules
 * Maps each state to valid next states
 */
export const STATE_TRANSITIONS = {
    "fresh-start": ["accepting-terms"],
    "accepting-terms": ["choosing-language"],
    "choosing-language": ["giving-phone-number"],
    "giving-phone-number": ["giving-full-name"],
    "giving-full-name": ["none"],
    "none": ["explore-products", "support", "settings"],
    "support": ["none"],
    "settings": ["changing-language", "none"],
    "changing-language": ["settings"],
    "explore-products": ["product-details", "review-cart", "none"],
    "product-details": ["product-details-addons", "explore-products", "review-cart"],
    "product-details-addons": ["product-details"],
    "review-cart": ["select-pickup-time", "explore-products"],
    "select-pickup-time": ["paying-for-order", "review-cart"],
    "paying-for-order": ["waiting-for-order", "select-pickup-time"],
    "waiting-for-order": ["none"],
    "banned": []
};

/**
 * Validates if a state transition is allowed
 * @param {string} fromState - Current state
 * @param {string} toState - Target state
 * @returns {boolean} - true if transition is valid, false otherwise
 */
export function isValidStateTransition(fromState, toState) {
    if (!fromState || !toState) {
        return false;
    }
    
    if (!VALID_STATES.includes(fromState) || !VALID_STATES.includes(toState)) {
        return false;
    }
    
    const allowedTransitions = STATE_TRANSITIONS[fromState] || [];
    return allowedTransitions.includes(toState);
}

/**
 * Safely transitions user to a new state with validation and error handling
 * @param {Object} ctx - User context
 * @param {string} newState - Target state
 * @param {string} stateDetails - Optional state details
 * @param {boolean} clearCart - Whether to clear cart during transition
 * @returns {Promise<boolean>} - true if successful, false if failed
 */
export async function safeStateTransition(ctx, newState, stateDetails = "none", clearCart = false) {
    try {
        // Validate current state
        if (!ctx.user || !ctx.user.state) {
            console.error('Invalid user context for state transition');
            return false;
        }
        
        // Check if transition is valid
        if (!isValidStateTransition(ctx.user.state, newState)) {
            console.error(`Invalid state transition from "${ctx.user.state}" to "${newState}"`);
            // For invalid transitions, reset to safe state
            await resetToSafeState(ctx);
            return false;
        }
        
        // Update state
        ctx.user.state = newState;
        ctx.user.stateDetails = stateDetails;
        
        // Clear cart if requested
        if (clearCart) {
            ctx.user.cart = [];
        }
        
        // Save with retry
        await saveWithRetry(ctx.user);
        
        console.log(`State transition successful: ${ctx.user.state} -> ${newState}`);
        return true;
        
    } catch (error) {
        console.error('Error during state transition:', error);
        await resetToSafeState(ctx);
        return false;
    }
}

/**
 * Resets user to a safe state (none) with error handling
 * @param {Object} ctx - User context
 * @returns {Promise<void>}
 */
export async function resetToSafeState(ctx) {
    try {
        if (!ctx.user) {
            console.error('Cannot reset state: invalid user context');
            return;
        }
        
        console.log(`Resetting user ${ctx.user.telegramId} to safe state`);
        
        // Reset to safe state
        ctx.user.state = "none";
        ctx.user.stateDetails = "none";
        ctx.user.cart = [];
        
        // Save with retry
        await saveWithRetry(ctx.user);
        
        // Show main menu
        await fns.displayMain(ctx);
        
    } catch (error) {
        console.error('Error resetting to safe state:', error);
        // If even reset fails, try to send error message
        try {
            await ctx.reply("⚠️ Session error. Please restart with /start");
        } catch (sendError) {
            console.error('Failed to send error message:', sendError);
        }
    }
}

/**
 * Validates user state and resets if invalid
 * @param {Object} ctx - User context
 * @param {string} expectedState - Expected state
 * @returns {Promise<boolean>} - true if valid, false if invalid
 */
export async function validateAndResetState(ctx, expectedState) {
    if (!ctx.user || !ctx.user.state) {
        console.error('Invalid user context');
        await resetToSafeState(ctx);
        return false;
    }
    
    if (ctx.user.state !== expectedState) {
        console.error(`State validation failed. Expected: ${expectedState}, Actual: ${ctx.user.state}`);
        await resetToSafeState(ctx);
        return false;
    }
    
    return true;
}

/**
 * Handles state corruption by resetting to safe state
 * @param {Object} ctx - User context
 * @param {string} reason - Reason for corruption
 * @returns {Promise<void>}
 */
export async function handleStateCorruption(ctx, reason) {
    console.error(`State corruption detected: ${reason}`);
    await resetToSafeState(ctx);
}

/**
 * Gets user's current state info for debugging
 * @param {Object} ctx - User context
 * @returns {Object} - State information
 */
export function getStateInfo(ctx) {
    if (!ctx.user) {
        return { error: 'No user context' };
    }
    
    return {
        telegramId: ctx.user.telegramId,
        currentState: ctx.user.state,
        stateDetails: ctx.user.stateDetails,
        cartLength: ctx.user.cart ? ctx.user.cart.length : 0,
        isValidState: VALID_STATES.includes(ctx.user.state),
        timestamp: new Date().toISOString()
    };
}

/**
 * Logs state information for debugging
 * @param {Object} ctx - User context
 * @param {string} action - Action being performed
 */
export function logStateInfo(ctx, action) {
    const stateInfo = getStateInfo(ctx);
    console.log(`[${action}] State Info:`, stateInfo);
}

/**
 * Checks if user is in a terminal state (can't transition further)
 * @param {string} state - Current state
 * @returns {boolean} - true if terminal state
 */
export function isTerminalState(state) {
    const terminalStates = ["waiting-for-order", "banned"];
    return terminalStates.includes(state);
}

/**
 * Checks if user is in a shopping flow state
 * @param {string} state - Current state
 * @returns {boolean} - true if in shopping flow
 */
export function isShoppingFlowState(state) {
    const shoppingStates = [
        "explore-products",
        "product-details",
        "product-details-addons",
        "review-cart",
        "select-pickup-time",
        "paying-for-order",
        "waiting-for-order"
    ];
    return shoppingStates.includes(state);
}

/**
 * Gets the next valid states for current state
 * @param {string} currentState - Current state
 * @returns {Array<string>} - Array of valid next states
 */
export function getValidNextStates(currentState) {
    return STATE_TRANSITIONS[currentState] || [];
}

/**
 * Emergency state recovery - resets user to fresh start
 * @param {Object} ctx - User context
 * @returns {Promise<void>}
 */
export async function emergencyStateRecovery(ctx) {
    try {
        console.log(`Emergency state recovery for user ${ctx.user?.telegramId}`);
        
        if (!ctx.user) {
            console.error('Cannot perform emergency recovery: no user context');
            return;
        }
        
        // Reset everything
        ctx.user.state = "fresh-start";
        ctx.user.stateDetails = "none";
        ctx.user.cart = [];
        ctx.user.agreedToTerms = false;
        ctx.user.preferredLanguage = null;
        ctx.user.phoneNumber = null;
        ctx.user.fullName = null;
        
        // Save with retry
        await saveWithRetry(ctx.user);
        
        // Show fresh start
        await fns.displayMain(ctx);
        
        console.log('Emergency state recovery completed');
        
    } catch (error) {
        console.error('Emergency state recovery failed:', error);
    }
}
