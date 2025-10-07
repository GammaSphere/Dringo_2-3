/**
 * Comprehensive input validation utilities
 * Provides robust validation for user inputs, callback data, and system data
 */

/**
 * Validates callback data structure
 * @param {string} data - Callback data to validate
 * @param {string} expectedPrefix - Expected prefix (e.g., "product_", "size_")
 * @returns {boolean} - true if valid, false if invalid
 */
export function validateCallbackData(data, expectedPrefix) {
    if (!data || typeof data !== 'string') {
        console.log('Invalid callback data: not a string or empty');
        return false;
    }
    
    if (!data.startsWith(expectedPrefix)) {
        console.log(`Invalid callback data: expected prefix "${expectedPrefix}", got "${data}"`);
        return false;
    }
    
    return true;
}

/**
 * Validates product ID format
 * @param {string} productId - Product ID to validate
 * @returns {boolean} - true if valid, false if invalid
 */
export function validateProductId(productId) {
    if (!productId || typeof productId !== 'string') {
        console.log('Invalid product ID: not a string or empty');
        return false;
    }
    
    // Check if it's a valid MongoDB ObjectId format (24 hex characters)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(productId)) {
        console.log(`Invalid product ID format: "${productId}"`);
        return false;
    }
    
    return true;
}

/**
 * Validates cart index
 * @param {number} cartIndex - Cart index to validate
 * @param {number} cartLength - Current cart length
 * @returns {boolean} - true if valid, false if invalid
 */
export function validateCartIndex(cartIndex, cartLength) {
    if (typeof cartIndex !== 'number' || isNaN(cartIndex)) {
        console.log(`Invalid cart index: not a number, got "${cartIndex}"`);
        return false;
    }
    
    if (cartIndex < 0 || cartIndex >= cartLength) {
        console.log(`Invalid cart index: out of bounds, got ${cartIndex}, cart length: ${cartLength}`);
        return false;
    }
    
    return true;
}

/**
 * Validates user state
 * @param {string} state - User state to validate
 * @param {Array<string>} validStates - Array of valid states
 * @returns {boolean} - true if valid, false if invalid
 */
export function validateUserState(state, validStates) {
    if (!state || typeof state !== 'string') {
        console.log('Invalid user state: not a string or empty');
        return false;
    }
    
    if (!validStates.includes(state)) {
        console.log(`Invalid user state: "${state}", valid states: ${validStates.join(', ')}`);
        return false;
    }
    
    return true;
}

/**
 * Validates phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - true if valid, false if invalid
 */
export function validatePhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        console.log('Invalid phone number: not a string or empty');
        return false;
    }
    
    // Check for Uzbek phone number format (+998XXXXXXXXX)
    const phoneRegex = /^\+998[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
        console.log(`Invalid phone number format: "${phoneNumber}"`);
        return false;
    }
    
    return true;
}

/**
 * Validates full name
 * @param {string} fullName - Full name to validate
 * @returns {boolean} - true if valid, false if invalid
 */
export function validateFullName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        console.log('Invalid full name: not a string or empty');
        return false;
    }
    
    // Check minimum length and basic format
    if (fullName.trim().length < 2) {
        console.log(`Invalid full name: too short, got "${fullName}"`);
        return false;
    }
    
    if (fullName.trim().length > 100) {
        console.log(`Invalid full name: too long, got "${fullName}"`);
        return false;
    }
    
    return true;
}

/**
 * Validates language code
 * @param {string} language - Language code to validate
 * @returns {boolean} - true if valid, false if invalid
 */
export function validateLanguage(language) {
    if (!language || typeof language !== 'string') {
        console.log('Invalid language: not a string or empty');
        return false;
    }
    
    const validLanguages = ['en', 'ru', 'uz'];
    if (!validLanguages.includes(language)) {
        console.log(`Invalid language: "${language}", valid languages: ${validLanguages.join(', ')}`);
        return false;
    }
    
    return true;
}

/**
 * Validates pickup time format
 * @param {string} pickupTime - Pickup time to validate
 * @returns {boolean} - true if valid, false if invalid
 */
export function validatePickupTime(pickupTime) {
    if (!pickupTime || typeof pickupTime !== 'string') {
        console.log('Invalid pickup time: not a string or empty');
        return false;
    }
    
    // Check for HH:MM format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(pickupTime)) {
        console.log(`Invalid pickup time format: "${pickupTime}"`);
        return false;
    }
    
    return true;
}

/**
 * Validates cart item structure
 * @param {Object} cartItem - Cart item to validate
 * @returns {boolean} - true if valid, false if invalid
 */
export function validateCartItem(cartItem) {
    if (!cartItem || typeof cartItem !== 'object') {
        console.log('Invalid cart item: not an object');
        return false;
    }
    
    // Check required fields
    const requiredFields = ['product', 'quantity', 'sizeOption', 'addOns', 'totalPrice'];
    for (const field of requiredFields) {
        if (!(field in cartItem)) {
            console.log(`Invalid cart item: missing field "${field}"`);
            return false;
        }
    }
    
    // Validate quantity
    if (typeof cartItem.quantity !== 'number' || cartItem.quantity < 1 || cartItem.quantity > 4) {
        console.log(`Invalid cart item quantity: ${cartItem.quantity}`);
        return false;
    }
    
    // Validate total price
    if (typeof cartItem.totalPrice !== 'number' || cartItem.totalPrice < 0) {
        console.log(`Invalid cart item total price: ${cartItem.totalPrice}`);
        return false;
    }
    
    return true;
}

/**
 * Validates order number format
 * @param {string} orderNumber - Order number to validate
 * @returns {boolean} - true if valid, false if invalid
 */
export function validateOrderNumber(orderNumber) {
    if (!orderNumber || typeof orderNumber !== 'string') {
        console.log('Invalid order number: not a string or empty');
        return false;
    }
    
    // Check for DR-YYYYMMDD-XXX format
    const orderNumberRegex = /^DR-\d{8}-\d{3}$/;
    if (!orderNumberRegex.test(orderNumber)) {
        console.log(`Invalid order number format: "${orderNumber}"`);
        return false;
    }
    
    return true;
}

/**
 * Comprehensive validation for user context
 * @param {Object} ctx - User context to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export function validateUserContext(ctx) {
    const errors = [];
    
    if (!ctx) {
        errors.push('Context is null or undefined');
        return { isValid: false, errors };
    }
    
    if (!ctx.user) {
        errors.push('User is null or undefined');
        return { isValid: false, errors };
    }
    
    if (!ctx.user.telegramId || typeof ctx.user.telegramId !== 'number') {
        errors.push('Invalid telegram ID');
    }
    
    if (!ctx.user.state || typeof ctx.user.state !== 'string') {
        errors.push('Invalid user state');
    }
    
    if (!Array.isArray(ctx.user.cart)) {
        errors.push('Invalid cart structure');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}
