import fns from "../customer_bot/journey/fns.js";
import saveWithRetry from "./saveWithRetry.js";
import { safeStateTransition, resetToSafeState, validateAndResetState } from "./stateManager.js";

/**
 * Validates if user is in the correct state for the current action
 * If not, clears cart and resets to "none" state
 * @param {Object} ctx - Context object
 * @param {string} expectedState - The expected state for this action
 * @returns {boolean} - true if valid, false if invalid
 */
export async function validateUserState(ctx, expectedState) {
    return await validateAndResetState(ctx, expectedState);
}

/**
 * Enhanced validation that checks both context type and user state
 * @param {Object} ctx - Context object  
 * @param {string} expectedState - The expected state for this action
 * @param {string} expectedCtxType - The expected context type (MESSAGE or CALLBACK_QUERY)
 * @returns {boolean} - true if valid, false if invalid
 */
export async function validateContextAndState(ctx, expectedState, expectedCtxType = 'callback_query') {
    // Handle /start command from any state
    if (ctx.ctxType === 'message' && ctx.text === "/start") {
        console.log(`/start command received from state: ${ctx.user.state}`);
        await safeStateTransition(ctx, "none", "none", true);
        return false;
    }
    
    // Check context type first
    if (ctx.ctxType !== expectedCtxType) {
        console.log(`Context type validation failed. Expected: ${expectedCtxType}, Actual: ${ctx.ctxType}`);
        await resetToSafeState(ctx);
        return false;
    }
    
    // Then check state
    return await validateUserState(ctx, expectedState);
}
