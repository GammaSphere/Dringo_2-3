/**
 * Product validation utilities
 * Provides robust validation for product operations, availability checks, and data integrity
 */

import Product from "../schemas/product.js";

/**
 * Validates product data structure
 * @param {Object} product - Product object to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export function validateProductData(product) {
    const errors = [];
    
    if (!product) {
        errors.push('Product is null or undefined');
        return { isValid: false, errors };
    }
    
    if (typeof product !== 'object') {
        errors.push('Product is not an object');
        return { isValid: false, errors };
    }
    
    // Check required fields
    const requiredFields = ['_id', 'title', 'description', 'sizeOptions', 'defaultAddOns', 'possibleAddOns', 'status'];
    for (const field of requiredFields) {
        if (!(field in product)) {
            errors.push(`Missing required field: ${field}`);
        }
    }
    
    // Validate status
    if (product.status && !['active', 'paused', 'inactive'].includes(product.status)) {
        errors.push(`Invalid status: ${product.status}`);
    }
    
    // Validate size options
    if (product.sizeOptions && !Array.isArray(product.sizeOptions)) {
        errors.push('Size options must be an array');
    } else if (product.sizeOptions && product.sizeOptions.length === 0) {
        errors.push('Size options cannot be empty');
    }
    
    // Validate add-ons
    if (product.defaultAddOns && !Array.isArray(product.defaultAddOns)) {
        errors.push('Default add-ons must be an array');
    }
    
    if (product.possibleAddOns && !Array.isArray(product.possibleAddOns)) {
        errors.push('Possible add-ons must be an array');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Checks if a product exists and is available
 * @param {string} productId - Product ID to check
 * @returns {Promise<Object>} - Result with exists, isActive, and product data
 */
export async function checkProductAvailability(productId) {
    try {
        if (!productId) {
            return { exists: false, isActive: false, product: null, error: 'Product ID is required' };
        }
        
        const product = await Product.findById(productId).exec();
        
        if (!product) {
            return { exists: false, isActive: false, product: null, error: 'Product not found' };
        }
        
        const isActive = product.status === 'active';
        
        return {
            exists: true,
            isActive,
            product,
            error: null
        };
        
    } catch (error) {
        console.error('Error checking product availability:', error);
        return {
            exists: false,
            isActive: false,
            product: null,
            error: error.message
        };
    }
}

/**
 * Validates product size option
 * @param {Object} product - Product object
 * @param {string} size - Size to validate
 * @returns {Object} - Validation result
 */
export function validateProductSize(product, size) {
    if (!product || !product.sizeOptions) {
        return { isValid: false, error: 'Product or size options not available' };
    }
    
    if (!size) {
        return { isValid: false, error: 'Size is required' };
    }
    
    const sizeOption = product.sizeOptions.find(option => option.size === size);
    
    if (!sizeOption) {
        return { isValid: false, error: `Size "${size}" not available for this product` };
    }
    
    return { isValid: true, sizeOption, error: null };
}

/**
 * Validates product add-on
 * @param {Object} product - Product object
 * @param {string} kind - Add-on kind (e.g., 'Sugar', 'Syrup')
 * @param {string} option - Add-on option (e.g., '2 spoons', 'vanilla')
 * @returns {Object} - Validation result
 */
export function validateProductAddOn(product, kind, option) {
    if (!product || !product.possibleAddOns) {
        return { isValid: false, error: 'Product or add-ons not available' };
    }
    
    if (!kind || !option) {
        return { isValid: false, error: 'Add-on kind and option are required' };
    }
    
    const addOn = product.possibleAddOns.find(ao => ao.kind === kind && ao.option === option);
    
    if (!addOn) {
        return { isValid: false, error: `Add-on "${kind}: ${option}" not available for this product` };
    }
    
    return { isValid: true, addOn, error: null };
}

/**
 * Gets all active products with validation
 * @returns {Promise<Object>} - Result with products and validation info
 */
export async function getActiveProducts() {
    try {
        const products = await Product.find({ status: 'active' })
            .populate('title')
            .populate('description')
            .exec();
        
        const validatedProducts = [];
        const errors = [];
        
        for (const product of products) {
            const validation = validateProductData(product);
            if (validation.isValid) {
                validatedProducts.push(product);
            } else {
                errors.push(`Product ${product._id}: ${validation.errors.join(', ')}`);
            }
        }
        
        return {
            success: true,
            products: validatedProducts,
            totalCount: products.length,
            validCount: validatedProducts.length,
            errors
        };
        
    } catch (error) {
        console.error('Error getting active products:', error);
        return {
            success: false,
            products: [],
            totalCount: 0,
            validCount: 0,
            errors: [error.message]
        };
    }
}

/**
 * Validates cart item against product data
 * @param {Object} cartItem - Cart item to validate
 * @param {Object} product - Product data
 * @returns {Object} - Validation result
 */
export function validateCartItemAgainstProduct(cartItem, product) {
    const errors = [];
    
    if (!cartItem || !product) {
        errors.push('Cart item or product data missing');
        return { isValid: false, errors };
    }
    
    // Check if product is still active
    if (product.status !== 'active') {
        errors.push('Product is no longer available');
    }
    
    // Validate size option
    const sizeValidation = validateProductSize(product, cartItem.sizeOption?.size);
    if (!sizeValidation.isValid) {
        errors.push(sizeValidation.error);
    }
    
    // Validate quantity
    if (cartItem.quantity < 1 || cartItem.quantity > 4) {
        errors.push('Invalid quantity');
    }
    
    // Validate add-ons
    if (cartItem.addOns && Array.isArray(cartItem.addOns)) {
        for (const addOn of cartItem.addOns) {
            const addOnValidation = validateProductAddOn(product, addOn.kind, addOn.option);
            if (!addOnValidation.isValid) {
                errors.push(addOnValidation.error);
            }
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates entire cart against current product data
 * @param {Array} cart - Cart items
 * @returns {Promise<Object>} - Validation result
 */
export async function validateCart(cart) {
    if (!Array.isArray(cart)) {
        return { isValid: false, errors: ['Cart is not an array'] };
    }
    
    const errors = [];
    const validatedCart = [];
    
    for (let i = 0; i < cart.length; i++) {
        const cartItem = cart[i];
        
        if (!cartItem.product) {
            errors.push(`Cart item ${i}: Missing product reference`);
            continue;
        }
        
        const availability = await checkProductAvailability(cartItem.product);
        
        if (!availability.exists) {
            errors.push(`Cart item ${i}: Product not found`);
            continue;
        }
        
        if (!availability.isActive) {
            errors.push(`Cart item ${i}: Product is no longer available`);
            continue;
        }
        
        const validation = validateCartItemAgainstProduct(cartItem, availability.product);
        
        if (validation.isValid) {
            validatedCart.push(cartItem);
        } else {
            errors.push(`Cart item ${i}: ${validation.errors.join(', ')}`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        validatedCart,
        originalCount: cart.length,
        validCount: validatedCart.length
    };
}

/**
 * Cleans cart by removing invalid items
 * @param {Array} cart - Cart to clean
 * @returns {Promise<Object>} - Cleaned cart and removed items info
 */
export async function cleanCart(cart) {
    const validation = await validateCart(cart);
    
    return {
        cleanedCart: validation.validatedCart,
        removedItems: validation.originalCount - validation.validCount,
        errors: validation.errors,
        wasCleaned: validation.originalCount !== validation.validCount
    };
}

/**
 * Gets product price for a specific size
 * @param {Object} product - Product object
 * @param {string} size - Size option
 * @returns {Object} - Price result
 */
export function getProductPrice(product, size) {
    const sizeValidation = validateProductSize(product, size);
    
    if (!sizeValidation.isValid) {
        return { success: false, price: 0, error: sizeValidation.error };
    }
    
    return {
        success: true,
        price: sizeValidation.sizeOption.price,
        error: null
    };
}

/**
 * Calculates total price for a cart item
 * @param {Object} cartItem - Cart item
 * @param {Object} product - Product data
 * @returns {Object} - Price calculation result
 */
export function calculateCartItemTotal(cartItem, product) {
    try {
        // Get base price
        const priceResult = getProductPrice(product, cartItem.sizeOption?.size);
        if (!priceResult.success) {
            return { success: false, total: 0, error: priceResult.error };
        }
        
        const basePrice = priceResult.price * cartItem.quantity;
        
        // Calculate add-ons total
        let addOnsTotal = 0;
        if (cartItem.addOns && Array.isArray(cartItem.addOns)) {
            for (const addOn of cartItem.addOns) {
                const addOnValidation = validateProductAddOn(product, addOn.kind, addOn.option);
                if (addOnValidation.isValid) {
                    addOnsTotal += addOnValidation.addOn.price || 0;
                }
            }
        }
        
        const total = basePrice + addOnsTotal;
        
        return {
            success: true,
            total,
            basePrice,
            addOnsTotal,
            error: null
        };
        
    } catch (error) {
        console.error('Error calculating cart item total:', error);
        return {
            success: false,
            total: 0,
            error: error.message
        };
    }
}

/**
 * Validates product data integrity
 * @param {string} productId - Product ID to validate
 * @returns {Promise<Object>} - Validation result
 */
export async function validateProductIntegrity(productId) {
    try {
        const availability = await checkProductAvailability(productId);
        
        if (!availability.exists) {
            return { isValid: false, error: 'Product not found' };
        }
        
        const productValidation = validateProductData(availability.product);
        
        return {
            isValid: productValidation.isValid,
            isActive: availability.isActive,
            errors: productValidation.errors,
            product: availability.product
        };
        
    } catch (error) {
        console.error('Error validating product integrity:', error);
        return {
            isValid: false,
            isActive: false,
            errors: [error.message],
            product: null
        };
    }
}
