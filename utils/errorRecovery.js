/**
 * Error recovery and graceful degradation utilities
 * Provides robust error handling, retry mechanisms, and fallback strategies
 */

import { resetToSafeState, emergencyStateRecovery } from "./stateManager.js";
import fns from "../customer_bot/journey/fns.js";

/**
 * Retry configuration for different operations
 */
export const RETRY_CONFIG = {
    database: { maxRetries: 3, delay: 1000, backoff: 2 },
    api: { maxRetries: 2, delay: 2000, backoff: 1.5 },
    telegram: { maxRetries: 2, delay: 1000, backoff: 1.5 },
    printer: { maxRetries: 1, delay: 3000, backoff: 1 }
};

/**
 * Executes a function with retry logic
 * @param {Function} operation - Function to execute
 * @param {string} operationType - Type of operation (database, api, telegram, printer)
 * @param {Object} context - Context object for error handling
 * @returns {Promise<Object>} - Result with success, data, and error info
 */
export async function executeWithRetry(operation, operationType, context = null) {
    const config = RETRY_CONFIG[operationType] || RETRY_CONFIG.database;
    let lastError = null;
    
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
        try {
            const result = await operation();
            return {
                success: true,
                data: result,
                attempts: attempt,
                error: null
            };
        } catch (error) {
            lastError = error;
            console.error(`${operationType} operation failed (attempt ${attempt}/${config.maxRetries}):`, error.message);
            
            // Don't retry on certain errors
            if (isNonRetryableError(error)) {
                console.log('Non-retryable error detected, stopping retries');
                break;
            }
            
            // Don't retry on last attempt
            if (attempt === config.maxRetries) {
                break;
            }
            
            // Calculate delay with exponential backoff
            const delay = config.delay * Math.pow(config.backoff, attempt - 1);
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    return {
        success: false,
        data: null,
        attempts: config.maxRetries,
        error: lastError
    };
}

/**
 * Checks if an error should not be retried
 * @param {Error} error - Error to check
 * @returns {boolean} - true if non-retryable
 */
function isNonRetryableError(error) {
    const nonRetryableErrors = [
        'ValidationError',
        'CastError',
        'TypeError',
        'ReferenceError',
        'SyntaxError'
    ];
    
    return nonRetryableErrors.includes(error.name) || 
           error.message.includes('Invalid') ||
           error.message.includes('not found') ||
           error.message.includes('unauthorized');
}

/**
 * Handles database operation errors with graceful degradation
 * @param {Error} error - Database error
 * @param {Object} ctx - User context
 * @param {string} operation - Operation that failed
 * @returns {Promise<void>}
 */
export async function handleDatabaseError(error, ctx, operation) {
    console.error(`Database error in ${operation}:`, error);
    
    if (error.name === 'VersionError') {
        console.log('Version conflict detected, attempting recovery');
        await resetToSafeState(ctx);
        return;
    }
    
    if (error.name === 'ValidationError') {
        console.log('Validation error, resetting user state');
        await resetToSafeState(ctx);
        return;
    }
    
    if (error.name === 'CastError') {
        console.log('Data type error, resetting user state');
        await resetToSafeState(ctx);
        return;
    }
    
    // For other database errors, try to continue with degraded functionality
    console.log('Database error, continuing with degraded functionality');
    try {
        await ctx.reply("⚠️ Temporary issue detected. Please try again in a moment.");
    } catch (sendError) {
        console.error('Failed to send error message:', sendError);
    }
}

/**
 * Handles Telegram API errors with graceful degradation
 * @param {Error} error - Telegram API error
 * @param {Object} ctx - User context
 * @param {string} operation - Operation that failed
 * @returns {Promise<void>}
 */
export async function handleTelegramError(error, ctx, operation) {
    console.error(`Telegram API error in ${operation}:`, error);
    
    if (error.response?.error_code === 400) {
        console.log('Bad request error, resetting user state');
        await resetToSafeState(ctx);
        return;
    }
    
    if (error.response?.error_code === 403) {
        console.log('Forbidden error, user may have blocked bot');
        // Don't try to send messages to blocked users
        return;
    }
    
    if (error.response?.error_code === 429) {
        console.log('Rate limit exceeded, waiting before retry');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return;
    }
    
    // For other Telegram errors, try to continue
    console.log('Telegram error, continuing with degraded functionality');
}

/**
 * Handles external service errors (printer, payment, etc.)
 * @param {Error} error - External service error
 * @param {Object} ctx - User context
 * @param {string} service - Service that failed
 * @returns {Promise<void>}
 */
export async function handleExternalServiceError(error, ctx, service) {
    console.error(`${service} error:`, error);
    
    if (service === 'printer') {
        console.log('Printer error, continuing without printing');
        try {
            await ctx.reply("⚠️ Receipt printing failed, but your order is still valid. Please show this message to staff.");
        } catch (sendError) {
            console.error('Failed to send printer error message:', sendError);
        }
        return;
    }
    
    if (service === 'payment') {
        console.log('Payment service error, resetting to payment state');
        try {
            await ctx.reply("⚠️ Payment service temporarily unavailable. Please try again in a moment.");
        } catch (sendError) {
            console.error('Failed to send payment error message:', sendError);
        }
        return;
    }
    
    // For other external services, try to continue
    console.log(`${service} error, continuing with degraded functionality`);
}

/**
 * Handles critical system errors that require emergency recovery
 * @param {Error} error - Critical error
 * @param {Object} ctx - User context
 * @param {string} operation - Operation that failed
 * @returns {Promise<void>}
 */
export async function handleCriticalError(error, ctx, operation) {
    console.error(`Critical error in ${operation}:`, error);
    
    // Log critical error for monitoring
    console.error('CRITICAL ERROR:', {
        operation,
        error: error.message,
        stack: error.stack,
        userId: ctx.user?.telegramId,
        timestamp: new Date().toISOString()
    });
    
    // Attempt emergency recovery
    try {
        await emergencyStateRecovery(ctx);
    } catch (recoveryError) {
        console.error('Emergency recovery failed:', recoveryError);
    }
}

/**
 * Wraps an async function with comprehensive error handling
 * @param {Function} fn - Function to wrap
 * @param {Object} ctx - User context
 * @param {string} operationName - Name of the operation
 * @returns {Promise<Object>} - Result with success and error info
 */
export async function withErrorHandling(fn, ctx, operationName) {
    try {
        const result = await fn();
        return {
            success: true,
            data: result,
            error: null
        };
    } catch (error) {
        console.error(`Error in ${operationName}:`, error);
        
        // Handle different types of errors
        if (error.name === 'VersionError' || error.name === 'ValidationError') {
            await handleDatabaseError(error, ctx, operationName);
        } else if (error.response?.error_code) {
            await handleTelegramError(error, ctx, operationName);
        } else if (error.message?.includes('printer') || error.message?.includes('payment')) {
            await handleExternalServiceError(error, ctx, operationName);
        } else {
            await handleCriticalError(error, ctx, operationName);
        }
        
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
}

/**
 * Creates a fallback response when primary operation fails
 * @param {Object} ctx - User context
 * @param {string} operation - Failed operation
 * @returns {Promise<void>}
 */
export async function createFallbackResponse(ctx, operation) {
    const fallbackMessages = {
        'product_selection': '⚠️ Product selection temporarily unavailable. Please try again later.',
        'cart_operation': '⚠️ Cart operation failed. Please restart with /start',
        'order_creation': '⚠️ Order creation failed. Please try again later.',
        'payment_processing': '⚠️ Payment processing failed. Please try again later.',
        'printer_operation': '⚠️ Receipt printing failed, but your order is still valid.',
        'default': '⚠️ Something went wrong. Please try again or restart with /start'
    };
    
    const message = fallbackMessages[operation] || fallbackMessages.default;
    
    try {
        await ctx.reply(message);
    } catch (sendError) {
        console.error('Failed to send fallback message:', sendError);
    }
}

/**
 * Monitors system health and performs preventive maintenance
 * @returns {Promise<Object>} - Health check result
 */
export async function performHealthCheck() {
    const health = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        checks: {}
    };
    
    try {
        // Check memory usage
        const memUsage = process.memoryUsage();
        health.checks.memory = {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024),
            status: memUsage.heapUsed / memUsage.heapTotal > 0.9 ? 'warning' : 'ok'
        };
        
        // Check uptime
        health.checks.uptime = {
            seconds: Math.floor(process.uptime()),
            status: 'ok'
        };
        
        // Check for memory leaks (simplified)
        if (health.checks.memory.status === 'warning') {
            health.status = 'degraded';
            console.warn('High memory usage detected');
        }
        
    } catch (error) {
        console.error('Health check failed:', error);
        health.status = 'unhealthy';
        health.error = error.message;
    }
    
    return health;
}

/**
 * Performs graceful shutdown with cleanup
 * @param {string} reason - Reason for shutdown
 * @returns {Promise<void>}
 */
export async function gracefulShutdown(reason) {
    console.log(`Graceful shutdown initiated: ${reason}`);
    
    try {
        // Perform final health check
        const health = await performHealthCheck();
        console.log('Final health check:', health);
        
        // Cleanup resources
        console.log('Cleaning up resources...');
        
        // Close database connections
        if (global.mongoose) {
            await global.mongoose.connection.close();
            console.log('Database connection closed');
        }
        
        // Stop bot polling
        if (global.customerBot) {
            await global.customerBot.stopPolling();
            console.log('Bot polling stopped');
        }
        
        console.log('Graceful shutdown completed');
        
    } catch (error) {
        console.error('Error during graceful shutdown:', error);
    }
}

/**
 * Error recovery middleware for Express routes
 * @param {Function} handler - Route handler
 * @returns {Function} - Wrapped handler with error recovery
 */
export function errorRecoveryMiddleware(handler) {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            console.error('Express route error:', error);
            
            // Send appropriate error response
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'Something went wrong. Please try again later.'
            });
        }
    };
}
