/**
 * Database optimization utilities
 * Provides query optimization, caching, and performance monitoring
 */

import Product from "../schemas/product.js";
import Customer from "../schemas/customer.js";
import Order from "../schemas/order.js";
import Localization from "../schemas/localization.js";

/**
 * Simple in-memory cache for frequently accessed data
 */
class SimpleCache {
    constructor(maxSize = 100, ttl = 300000) { // 5 minutes default TTL
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }
    
    set(key, value) {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        // Check if item has expired
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    clear() {
        this.cache.clear();
    }
    
    size() {
        return this.cache.size;
    }
}

// Global cache instances
const productCache = new SimpleCache(50, 300000); // 5 minutes
const localizationCache = new SimpleCache(200, 600000); // 10 minutes
const customerCache = new SimpleCache(100, 180000); // 3 minutes

/**
 * Optimized product query with caching
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Products
 */
export async function getProductsOptimized(filters = {}, options = {}) {
    const cacheKey = `products_${JSON.stringify(filters)}_${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = productCache.get(cacheKey);
    if (cached) {
        console.log('Products loaded from cache');
        return cached;
    }
    
    try {
        // Build query with optimization
        let query = Product.find(filters);
        
        // Add population with specific fields only
        if (options.populate) {
            query = query.populate({
                path: 'title',
                select: 'key translations status'
            }).populate({
                path: 'description',
                select: 'key translations status'
            });
        }
        
        // Add sorting
        if (options.sort) {
            query = query.sort(options.sort);
        }
        
        // Add limit
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        // Use lean for read-only operations
        if (options.lean !== false) {
            query = query.lean();
        }
        
        const products = await query.exec();
        
        // Cache the result
        productCache.set(cacheKey, products);
        
        console.log(`Products loaded from database (${products.length} items)`);
        return products;
        
    } catch (error) {
        console.error('Error loading products:', error);
        throw error;
    }
}

/**
 * Optimized customer query with caching
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options
 * @returns {Promise<Object|null>} - Customer
 */
export async function getCustomerOptimized(filters, options = {}) {
    const cacheKey = `customer_${JSON.stringify(filters)}_${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = customerCache.get(cacheKey);
    if (cached) {
        console.log('Customer loaded from cache');
        return cached;
    }
    
    try {
        let query = Customer.findOne(filters);
        
        // Add population with specific fields only
        if (options.populate) {
            query = query.populate({
                path: 'cart.product',
                select: 'title description status'
            });
        }
        
        // Use lean for read-only operations
        if (options.lean !== false) {
            query = query.lean();
        }
        
        const customer = await query.exec();
        
        // Cache the result (only if customer exists)
        if (customer) {
            customerCache.set(cacheKey, customer);
        }
        
        console.log('Customer loaded from database');
        return customer;
        
    } catch (error) {
        console.error('Error loading customer:', error);
        throw error;
    }
}

/**
 * Optimized localization query with caching
 * @param {string} key - Localization key
 * @param {Object} options - Query options
 * @returns {Promise<Object|null>} - Localization
 */
export async function getLocalizationOptimized(key, options = {}) {
    const cacheKey = `localization_${key}_${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = localizationCache.get(cacheKey);
    if (cached) {
        return cached;
    }
    
    try {
        let query = Localization.findOne({ key });
        
        // Use lean for read-only operations
        if (options.lean !== false) {
            query = query.lean();
        }
        
        const localization = await query.exec();
        
        // Cache the result (only if localization exists)
        if (localization) {
            localizationCache.set(cacheKey, localization);
        }
        
        return localization;
        
    } catch (error) {
        console.error('Error loading localization:', error);
        throw error;
    }
}

/**
 * Optimized order query with proper population
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Orders
 */
export async function getOrdersOptimized(filters = {}, options = {}) {
    try {
        let query = Order.find(filters);
        
        // Add population with specific fields only
        query = query.populate({
            path: 'customer',
            select: 'telegramId fullName phoneNumber preferredLanguage'
        }).populate({
            path: 'selectedProducts.product',
            populate: [
                { path: 'title', select: 'key translations' },
                { path: 'description', select: 'key translations' }
            ],
            select: 'title description status'
        });
        
        // Add sorting
        if (options.sort) {
            query = query.sort(options.sort);
        }
        
        // Add limit
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        const orders = await query.exec();
        
        console.log(`Orders loaded from database (${orders.length} items)`);
        return orders;
        
    } catch (error) {
        console.error('Error loading orders:', error);
        throw error;
    }
}

/**
 * Batch operations for better performance
 * @param {Array} operations - Array of database operations
 * @returns {Promise<Array>} - Results
 */
export async function executeBatchOperations(operations) {
    try {
        const results = await Promise.allSettled(operations);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        console.log(`Batch operations completed: ${successful} successful, ${failed} failed`);
        
        return results;
        
    } catch (error) {
        console.error('Error executing batch operations:', error);
        throw error;
    }
}

/**
 * Optimized product search with indexing
 * @param {string} searchTerm - Search term
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Search results
 */
export async function searchProductsOptimized(searchTerm, options = {}) {
    try {
        // Use text search if available
        const query = Product.find({
            $text: { $search: searchTerm }
        }, {
            score: { $meta: 'textScore' }
        }).sort({
            score: { $meta: 'textScore' }
        });
        
        // Add population
        query.populate('title').populate('description');
        
        // Add limit
        if (options.limit) {
            query.limit(options.limit);
        }
        
        const products = await query.exec();
        
        console.log(`Product search completed: ${products.length} results for "${searchTerm}"`);
        return products;
        
    } catch (error) {
        console.error('Error searching products:', error);
        // Fallback to simple find
        return await Product.find({}).populate('title').populate('description').exec();
    }
}

/**
 * Cache management utilities
 */
export const cacheManager = {
    /**
     * Clear all caches
     */
    clearAll() {
        productCache.clear();
        localizationCache.clear();
        customerCache.clear();
        console.log('All caches cleared');
    },
    
    /**
     * Clear specific cache
     * @param {string} cacheType - Cache type (products, localizations, customers)
     */
    clear(cacheType) {
        switch (cacheType) {
            case 'products':
                productCache.clear();
                break;
            case 'localizations':
                localizationCache.clear();
                break;
            case 'customers':
                customerCache.clear();
                break;
            default:
                console.warn(`Unknown cache type: ${cacheType}`);
        }
    },
    
    /**
     * Get cache statistics
     * @returns {Object} - Cache statistics
     */
    getStats() {
        return {
            products: productCache.size(),
            localizations: localizationCache.size(),
            customers: customerCache.size(),
            total: productCache.size() + localizationCache.size() + customerCache.size()
        };
    },
    
    /**
     * Invalidate cache entries matching pattern
     * @param {string} pattern - Pattern to match
     */
    invalidatePattern(pattern) {
        // This is a simplified implementation
        // In a real application, you'd want more sophisticated pattern matching
        console.log(`Invalidating cache entries matching pattern: ${pattern}`);
        this.clearAll();
    }
};

/**
 * Database performance monitoring
 */
export const performanceMonitor = {
    /**
     * Monitor query performance
     * @param {string} operation - Operation name
     * @param {Function} queryFn - Query function
     * @returns {Promise<any>} - Query result
     */
    async monitorQuery(operation, queryFn) {
        const startTime = Date.now();
        
        try {
            const result = await queryFn();
            const duration = Date.now() - startTime;
            
            console.log(`Query performance [${operation}]: ${duration}ms`);
            
            // Log slow queries
            if (duration > 1000) {
                console.warn(`Slow query detected [${operation}]: ${duration}ms`);
            }
            
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`Query failed [${operation}]: ${duration}ms - ${error.message}`);
            throw error;
        }
    },
    
    /**
     * Get performance statistics
     * @returns {Object} - Performance stats
     */
    getStats() {
        return {
            cacheStats: cacheManager.getStats(),
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
    }
};

/**
 * Database connection optimization
 */
export const connectionOptimizer = {
    /**
     * Optimize MongoDB connection settings
     * @param {Object} mongoose - Mongoose instance
     */
    optimizeConnection(mongoose) {
        // Set connection options for better performance
        mongoose.set('bufferCommands', false);
        mongoose.set('bufferMaxEntries', 0);
        
        // Enable query optimization
        mongoose.set('useNewUrlParser', true);
        mongoose.set('useUnifiedTopology', true);
        
        // Set connection pool options
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferMaxEntries: 0,
            bufferCommands: false
        };
        
        console.log('Database connection optimized');
        return options;
    },
    
    /**
     * Monitor connection health
     * @param {Object} mongoose - Mongoose instance
     * @returns {Object} - Connection health info
     */
    getConnectionHealth(mongoose) {
        const connection = mongoose.connection;
        
        return {
            readyState: connection.readyState,
            host: connection.host,
            port: connection.port,
            name: connection.name,
            collections: Object.keys(connection.collections).length
        };
    }
};
