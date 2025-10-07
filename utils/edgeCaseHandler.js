/**
 * Edge case handling and malformed data protection utilities
 * Provides comprehensive protection against edge cases and malformed data
 */

import { resetToSafeState, emergencyStateRecovery } from "./stateManager.js";
import { validateUserContext } from "./inputValidation.js";
import { cleanCart } from "./productValidation.js";

/**
 * Edge case detection and handling
 */
export class EdgeCaseHandler {
    constructor() {
        this.edgeCaseCounts = new Map();
        this.maxEdgeCases = 10; // Max edge cases per user per hour
        this.edgeCaseWindow = 3600000; // 1 hour in milliseconds
    }
    
    /**
     * Detects and handles edge cases
     * @param {Object} ctx - User context
     * @param {string} operation - Operation being performed
     * @param {Object} data - Data being processed
     * @returns {Promise<boolean>} - true if edge case handled, false if normal processing
     */
    async handleEdgeCase(ctx, operation, data) {
        try {
            // Check for malformed data
            if (this.isMalformedData(data)) {
                console.warn(`Malformed data detected in ${operation}:`, data);
                await this.handleMalformedData(ctx, operation, data);
                return true;
            }
            
            // Check for invalid state transitions
            if (this.isInvalidStateTransition(ctx, operation)) {
                console.warn(`Invalid state transition detected in ${operation}`);
                await this.handleInvalidStateTransition(ctx, operation);
                return true;
            }
            
            // Check for data corruption
            if (this.isDataCorruption(ctx, operation)) {
                console.warn(`Data corruption detected in ${operation}`);
                await this.handleDataCorruption(ctx, operation);
                return true;
            }
            
            // Check for edge case frequency
            if (this.isEdgeCaseFrequencyExceeded(ctx)) {
                console.warn(`Edge case frequency exceeded for user ${ctx.user?.telegramId}`);
                await this.handleEdgeCaseFrequencyExceeded(ctx);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('Error in edge case handler:', error);
            await this.handleCriticalEdgeCase(ctx, error);
            return true;
        }
    }
    
    /**
     * Checks if data is malformed
     * @param {Object} data - Data to check
     * @returns {boolean} - true if malformed
     */
    isMalformedData(data) {
        if (!data) return true;
        
        // Check for circular references
        try {
            JSON.stringify(data);
        } catch (error) {
            if (error.message.includes('circular')) {
                return true;
            }
        }
        
        // Check for extremely large objects
        const dataSize = JSON.stringify(data).length;
        if (dataSize > 1000000) { // 1MB limit
            return true;
        }
        
        // Check for invalid types
        if (typeof data === 'function') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Checks if state transition is invalid
     * @param {Object} ctx - User context
     * @param {string} operation - Operation being performed
     * @returns {boolean} - true if invalid
     */
    isInvalidStateTransition(ctx, operation) {
        if (!ctx.user || !ctx.user.state) {
            return true;
        }
        
        // Check for undefined or null states
        if (ctx.user.state === 'undefined' || ctx.user.state === 'null') {
            return true;
        }
        
        // Check for invalid state values
        const validStates = [
            'fresh-start', 'accepting-terms', 'choosing-language', 'giving-phone-number',
            'giving-full-name', 'none', 'support', 'settings', 'changing-language',
            'explore-products', 'product-details', 'product-details-addons',
            'review-cart', 'select-pickup-time', 'paying-for-order', 'waiting-for-order', 'banned'
        ];
        
        if (!validStates.includes(ctx.user.state)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Checks if data is corrupted
     * @param {Object} ctx - User context
     * @param {string} operation - Operation being performed
     * @returns {boolean} - true if corrupted
     */
    isDataCorruption(ctx, operation) {
        if (!ctx.user) return true;
        
        // Check for corrupted cart data
        if (ctx.user.cart && !Array.isArray(ctx.user.cart)) {
            return true;
        }
        
        // Check for corrupted cart items
        if (ctx.user.cart && Array.isArray(ctx.user.cart)) {
            for (const item of ctx.user.cart) {
                if (!item || typeof item !== 'object') {
                    return true;
                }
                if (!item.product || !item.quantity || typeof item.quantity !== 'number') {
                    return true;
                }
                if (item.quantity < 0 || item.quantity > 10) {
                    return true;
                }
            }
        }
        
        // Check for corrupted state details
        if (ctx.user.stateDetails && typeof ctx.user.stateDetails !== 'string') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Checks if edge case frequency is exceeded
     * @param {Object} ctx - User context
     * @returns {boolean} - true if exceeded
     */
    isEdgeCaseFrequencyExceeded(ctx) {
        if (!ctx.user?.telegramId) return false;
        
        const userId = ctx.user.telegramId.toString();
        const now = Date.now();
        
        if (!this.edgeCaseCounts.has(userId)) {
            this.edgeCaseCounts.set(userId, []);
        }
        
        const userEdgeCases = this.edgeCaseCounts.get(userId);
        
        // Remove old edge cases outside the window
        const recentEdgeCases = userEdgeCases.filter(timestamp => 
            now - timestamp < this.edgeCaseWindow
        );
        
        this.edgeCaseCounts.set(userId, recentEdgeCases);
        
        return recentEdgeCases.length >= this.maxEdgeCases;
    }
    
    /**
     * Handles malformed data
     * @param {Object} ctx - User context
     * @param {string} operation - Operation being performed
     * @param {Object} data - Malformed data
     */
    async handleMalformedData(ctx, operation, data) {
        console.log(`Handling malformed data in ${operation}`);
        
        try {
            // Reset user to safe state
            await resetToSafeState(ctx);
            
            // Send user-friendly message
            await ctx.reply("⚠️ Invalid data detected. Please restart with /start");
            
        } catch (error) {
            console.error('Error handling malformed data:', error);
        }
    }
    
    /**
     * Handles invalid state transitions
     * @param {Object} ctx - User context
     * @param {string} operation - Operation being performed
     */
    async handleInvalidStateTransition(ctx, operation) {
        console.log(`Handling invalid state transition in ${operation}`);
        
        try {
            // Reset user to safe state
            await resetToSafeState(ctx);
            
            // Send user-friendly message
            await ctx.reply("⚠️ Session error detected. Please restart with /start");
            
        } catch (error) {
            console.error('Error handling invalid state transition:', error);
        }
    }
    
    /**
     * Handles data corruption
     * @param {Object} ctx - User context
     * @param {string} operation - Operation being performed
     */
    async handleDataCorruption(ctx, operation) {
        console.log(`Handling data corruption in ${operation}`);
        
        try {
            // Clean up corrupted data
            if (ctx.user.cart && !Array.isArray(ctx.user.cart)) {
                ctx.user.cart = [];
            }
            
            if (ctx.user.stateDetails && typeof ctx.user.stateDetails !== 'string') {
                ctx.user.stateDetails = 'none';
            }
            
            // Reset to safe state
            await resetToSafeState(ctx);
            
            // Send user-friendly message
            await ctx.reply("⚠️ Data corruption detected. Your session has been reset. Please restart with /start");
            
        } catch (error) {
            console.error('Error handling data corruption:', error);
        }
    }
    
    /**
     * Handles edge case frequency exceeded
     * @param {Object} ctx - User context
     */
    async handleEdgeCaseFrequencyExceeded(ctx) {
        console.log(`Handling edge case frequency exceeded for user ${ctx.user?.telegramId}`);
        
        try {
            // Perform emergency recovery
            await emergencyStateRecovery(ctx);
            
            // Send warning message
            await ctx.reply("⚠️ Multiple errors detected. Your session has been reset. Please restart with /start");
            
        } catch (error) {
            console.error('Error handling edge case frequency exceeded:', error);
        }
    }
    
    /**
     * Handles critical edge cases
     * @param {Object} ctx - User context
     * @param {Error} error - Critical error
     */
    async handleCriticalEdgeCase(ctx, error) {
        console.error('Handling critical edge case:', error);
        
        try {
            // Perform emergency recovery
            await emergencyStateRecovery(ctx);
            
            // Send critical error message
            await ctx.reply("⚠️ Critical error detected. Your session has been reset. Please restart with /start");
            
        } catch (recoveryError) {
            console.error('Error in critical edge case recovery:', recoveryError);
        }
    }
    
    /**
     * Records edge case occurrence
     * @param {Object} ctx - User context
     * @param {string} type - Type of edge case
     */
    recordEdgeCase(ctx, type) {
        if (!ctx.user?.telegramId) return;
        
        const userId = ctx.user.telegramId.toString();
        const now = Date.now();
        
        if (!this.edgeCaseCounts.has(userId)) {
            this.edgeCaseCounts.set(userId, []);
        }
        
        const userEdgeCases = this.edgeCaseCounts.get(userId);
        userEdgeCases.push(now);
        
        console.log(`Edge case recorded: ${type} for user ${userId}`);
    }
    
    /**
     * Gets edge case statistics
     * @returns {Object} - Edge case statistics
     */
    getEdgeCaseStats() {
        const now = Date.now();
        const stats = {
            totalUsers: this.edgeCaseCounts.size,
            activeUsers: 0,
            totalEdgeCases: 0,
            recentEdgeCases: 0
        };
        
        for (const [userId, edgeCases] of this.edgeCaseCounts.entries()) {
            const recentEdgeCases = edgeCases.filter(timestamp => 
                now - timestamp < this.edgeCaseWindow
            );
            
            stats.totalEdgeCases += edgeCases.length;
            stats.recentEdgeCases += recentEdgeCases.length;
            
            if (recentEdgeCases.length > 0) {
                stats.activeUsers++;
            }
        }
        
        return stats;
    }
    
    /**
     * Cleans up old edge case records
     */
    cleanupOldRecords() {
        const now = Date.now();
        
        for (const [userId, edgeCases] of this.edgeCaseCounts.entries()) {
            const recentEdgeCases = edgeCases.filter(timestamp => 
                now - timestamp < this.edgeCaseWindow
            );
            
            if (recentEdgeCases.length === 0) {
                this.edgeCaseCounts.delete(userId);
            } else {
                this.edgeCaseCounts.set(userId, recentEdgeCases);
            }
        }
    }
}

// Global edge case handler instance
const edgeCaseHandler = new EdgeCaseHandler();

/**
 * Data sanitization utilities
 */
export const dataSanitizer = {
    /**
     * Sanitizes user input
     * @param {any} input - Input to sanitize
     * @returns {any} - Sanitized input
     */
    sanitizeInput(input) {
        if (input === null || input === undefined) {
            return null;
        }
        
        if (typeof input === 'string') {
            // Remove potentially dangerous characters
            return input.replace(/[<>\"'&]/g, '');
        }
        
        if (typeof input === 'object') {
            // Recursively sanitize object properties
            const sanitized = {};
            for (const [key, value] of Object.entries(input)) {
                sanitized[key] = this.sanitizeInput(value);
            }
            return sanitized;
        }
        
        return input;
    },
    
    /**
     * Validates and sanitizes callback data
     * @param {string} callbackData - Callback data to sanitize
     * @returns {string|null} - Sanitized callback data or null if invalid
     */
    sanitizeCallbackData(callbackData) {
        if (!callbackData || typeof callbackData !== 'string') {
            return null;
        }
        
        // Check length
        if (callbackData.length > 64) {
            return null;
        }
        
        // Check for valid characters only
        if (!/^[a-zA-Z0-9_\-\.]+$/.test(callbackData)) {
            return null;
        }
        
        return callbackData;
    },
    
    /**
     * Validates and sanitizes user state
     * @param {string} state - State to sanitize
     * @returns {string|null} - Sanitized state or null if invalid
     */
    sanitizeUserState(state) {
        if (!state || typeof state !== 'string') {
            return null;
        }
        
        const validStates = [
            'fresh-start', 'accepting-terms', 'choosing-language', 'giving-phone-number',
            'giving-full-name', 'none', 'support', 'settings', 'changing-language',
            'explore-products', 'product-details', 'product-details-addons',
            'review-cart', 'select-pickup-time', 'paying-for-order', 'waiting-for-order', 'banned'
        ];
        
        if (!validStates.includes(state)) {
            return null;
        }
        
        return state;
    }
};

/**
 * Malformed data detection utilities
 */
export const malformedDataDetector = {
    /**
     * Detects malformed cart data
     * @param {any} cart - Cart data to check
     * @returns {boolean} - true if malformed
     */
    isMalformedCart(cart) {
        if (!Array.isArray(cart)) {
            return true;
        }
        
        for (const item of cart) {
            if (!item || typeof item !== 'object') {
                return true;
            }
            
            if (!item.product || !item.quantity || typeof item.quantity !== 'number') {
                return true;
            }
            
            if (item.quantity < 0 || item.quantity > 10) {
                return true;
            }
            
            if (!item.sizeOption || typeof item.sizeOption !== 'object') {
                return true;
            }
            
            if (!Array.isArray(item.addOns)) {
                return true;
            }
        }
        
        return false;
    },
    
    /**
     * Detects malformed product data
     * @param {any} product - Product data to check
     * @returns {boolean} - true if malformed
     */
    isMalformedProduct(product) {
        if (!product || typeof product !== 'object') {
            return true;
        }
        
        if (!product._id || !product.title || !product.description) {
            return true;
        }
        
        if (!Array.isArray(product.sizeOptions) || product.sizeOptions.length === 0) {
            return true;
        }
        
        if (!Array.isArray(product.defaultAddOns)) {
            return true;
        }
        
        if (!Array.isArray(product.possibleAddOns)) {
            return true;
        }
        
        return false;
    },
    
    /**
     * Detects malformed user data
     * @param {any} user - User data to check
     * @returns {boolean} - true if malformed
     */
    isMalformedUser(user) {
        if (!user || typeof user !== 'object') {
            return true;
        }
        
        if (!user.telegramId || typeof user.telegramId !== 'number') {
            return true;
        }
        
        if (!user.state || typeof user.state !== 'string') {
            return true;
        }
        
        if (user.stateDetails && typeof user.stateDetails !== 'string') {
            return true;
        }
        
        if (user.cart && !Array.isArray(user.cart)) {
            return true;
        }
        
        return false;
    }
};

/**
 * Edge case prevention utilities
 */
export const edgeCasePrevention = {
    /**
     * Prevents edge cases in user operations
     * @param {Object} ctx - User context
     * @param {string} operation - Operation being performed
     * @returns {Promise<boolean>} - true if operation should proceed
     */
    async preventEdgeCases(ctx, operation) {
        try {
            // Validate user context
            const contextValidation = validateUserContext(ctx);
            if (!contextValidation.isValid) {
                console.warn(`Invalid user context in ${operation}:`, contextValidation.errors);
                await resetToSafeState(ctx);
                return false;
            }
            
            // Check for edge cases
            const edgeCaseHandled = await edgeCaseHandler.handleEdgeCase(ctx, operation, ctx.data);
            if (edgeCaseHandled) {
                return false;
            }
            
            // Sanitize input data
            if (ctx.data) {
                ctx.data = dataSanitizer.sanitizeCallbackData(ctx.data);
                if (!ctx.data) {
                    console.warn(`Invalid callback data in ${operation}`);
                    await ctx.reply("⚠️ Invalid input. Please try again.");
                    return false;
                }
            }
            
            return true;
            
        } catch (error) {
            console.error(`Error preventing edge cases in ${operation}:`, error);
            await resetToSafeState(ctx);
            return false;
        }
    },
    
    /**
     * Prevents edge cases in cart operations
     * @param {Object} ctx - User context
     * @param {string} operation - Operation being performed
     * @returns {Promise<boolean>} - true if operation should proceed
     */
    async preventCartEdgeCases(ctx, operation) {
        try {
            // Check for malformed cart
            if (malformedDataDetector.isMalformedCart(ctx.user.cart)) {
                console.warn(`Malformed cart detected in ${operation}`);
                ctx.user.cart = [];
                await resetToSafeState(ctx);
                return false;
            }
            
            // Clean cart if needed
            const cartValidation = await cleanCart(ctx.user.cart);
            if (cartValidation.wasCleaned) {
                console.log(`Cart cleaned in ${operation}: ${cartValidation.removedItems} items removed`);
                ctx.user.cart = cartValidation.cleanedCart;
            }
            
            return true;
            
        } catch (error) {
            console.error(`Error preventing cart edge cases in ${operation}:`, error);
            await resetToSafeState(ctx);
            return false;
        }
    }
};

/**
 * Get edge case handler instance
 * @returns {EdgeCaseHandler} - Edge case handler instance
 */
export function getEdgeCaseHandler() {
    return edgeCaseHandler;
}

/**
 * Initialize edge case handling
 */
export function initializeEdgeCaseHandling() {
    try {
        console.log('Initializing edge case handling...');
        
        // Set up periodic cleanup
        setInterval(() => {
            edgeCaseHandler.cleanupOldRecords();
        }, 300000); // 5 minutes
        
        console.log('Edge case handling initialized');
        
    } catch (error) {
        console.error('Error initializing edge case handling:', error);
    }
}
