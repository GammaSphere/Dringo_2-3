/**
 * Memory management and resource cleanup utilities
 * Provides memory monitoring, garbage collection, and resource cleanup
 */

import { cacheManager } from "./databaseOptimization.js";

/**
 * Memory management configuration
 */
const MEMORY_CONFIG = {
    maxHeapUsage: 0.8, // 80% of available memory
    gcInterval: 300000, // 5 minutes
    cleanupInterval: 600000, // 10 minutes
    maxCacheSize: 1000,
    warningThreshold: 0.7 // 70% memory usage warning
};

/**
 * Memory monitoring and management
 */
class MemoryManager {
    constructor() {
        this.gcInterval = null;
        this.cleanupInterval = null;
        this.isMonitoring = false;
        this.memoryHistory = [];
        this.maxHistorySize = 100;
    }
    
    /**
     * Start memory monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.log('Memory monitoring already started');
            return;
        }
        
        this.isMonitoring = true;
        console.log('Starting memory monitoring...');
        
        // Start garbage collection interval
        this.gcInterval = setInterval(() => {
            this.performGarbageCollection();
        }, MEMORY_CONFIG.gcInterval);
        
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, MEMORY_CONFIG.cleanupInterval);
        
        // Monitor memory usage
        this.monitorMemoryUsage();
    }
    
    /**
     * Stop memory monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        
        this.isMonitoring = false;
        console.log('Stopping memory monitoring...');
        
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = null;
        }
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
    
    /**
     * Monitor memory usage
     */
    monitorMemoryUsage() {
        if (!this.isMonitoring) return;
        
        const memUsage = process.memoryUsage();
        const totalMem = memUsage.heapTotal;
        const usedMem = memUsage.heapUsed;
        const usagePercent = usedMem / totalMem;
        
        // Store in history
        this.memoryHistory.push({
            timestamp: Date.now(),
            heapUsed: usedMem,
            heapTotal: totalMem,
            usagePercent,
            rss: memUsage.rss,
            external: memUsage.external
        });
        
        // Keep history size manageable
        if (this.memoryHistory.length > this.maxHistorySize) {
            this.memoryHistory.shift();
        }
        
        // Check for memory warnings
        if (usagePercent > MEMORY_CONFIG.warningThreshold) {
            console.warn(`High memory usage detected: ${(usagePercent * 100).toFixed(2)}%`);
        }
        
        // Check for critical memory usage
        if (usagePercent > MEMORY_CONFIG.maxHeapUsage) {
            console.error(`Critical memory usage: ${(usagePercent * 100).toFixed(2)}%`);
            this.performEmergencyCleanup();
        }
        
        // Schedule next check
        setTimeout(() => this.monitorMemoryUsage(), 30000); // Check every 30 seconds
    }
    
    /**
     * Perform garbage collection
     */
    performGarbageCollection() {
        try {
            const beforeGC = process.memoryUsage();
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
                console.log('Garbage collection performed');
            } else {
                console.log('Garbage collection not available (run with --expose-gc flag)');
            }
            
            const afterGC = process.memoryUsage();
            const freed = beforeGC.heapUsed - afterGC.heapUsed;
            
            if (freed > 0) {
                console.log(`Garbage collection freed ${(freed / 1024 / 1024).toFixed(2)} MB`);
            }
            
        } catch (error) {
            console.error('Error during garbage collection:', error);
        }
    }
    
    /**
     * Perform regular cleanup
     */
    performCleanup() {
        try {
            console.log('Performing regular cleanup...');
            
            // Clear expired cache entries
            this.clearExpiredCache();
            
            // Clean up temporary data
            this.cleanupTemporaryData();
            
            // Log memory statistics
            this.logMemoryStats();
            
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
    
    /**
     * Perform emergency cleanup
     */
    performEmergencyCleanup() {
        try {
            console.log('Performing emergency cleanup...');
            
            // Clear all caches
            cacheManager.clearAll();
            
            // Force garbage collection
            if (global.gc) {
                global.gc();
            }
            
            // Clear memory history
            this.memoryHistory = [];
            
            console.log('Emergency cleanup completed');
            
        } catch (error) {
            console.error('Error during emergency cleanup:', error);
        }
    }
    
    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        try {
            const stats = cacheManager.getStats();
            if (stats.total > MEMORY_CONFIG.maxCacheSize) {
                console.log('Cache size exceeded, clearing caches...');
                cacheManager.clearAll();
            }
        } catch (error) {
            console.error('Error clearing expired cache:', error);
        }
    }
    
    /**
     * Clean up temporary data
     */
    cleanupTemporaryData() {
        try {
            // Clear any temporary variables or objects
            // This is a placeholder for application-specific cleanup
            
            // Clear any global temporary data
            if (global.tempData) {
                global.tempData = {};
            }
            
        } catch (error) {
            console.error('Error cleaning up temporary data:', error);
        }
    }
    
    /**
     * Log memory statistics
     */
    logMemoryStats() {
        try {
            const memUsage = process.memoryUsage();
            const stats = cacheManager.getStats();
            
            console.log('Memory Statistics:', {
                heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
                external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
                cacheSize: stats.total,
                uptime: `${Math.floor(process.uptime())} seconds`
            });
            
        } catch (error) {
            console.error('Error logging memory stats:', error);
        }
    }
    
    /**
     * Get memory statistics
     * @returns {Object} - Memory statistics
     */
    getMemoryStats() {
        const memUsage = process.memoryUsage();
        const stats = cacheManager.getStats();
        
        return {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            rss: memUsage.rss,
            external: memUsage.external,
            usagePercent: memUsage.heapUsed / memUsage.heapTotal,
            cacheSize: stats.total,
            uptime: process.uptime(),
            history: this.memoryHistory.slice(-10) // Last 10 entries
        };
    }
    
    /**
     * Get memory health status
     * @returns {Object} - Health status
     */
    getHealthStatus() {
        const stats = this.getMemoryStats();
        const usagePercent = stats.usagePercent;
        
        let status = 'healthy';
        if (usagePercent > MEMORY_CONFIG.maxHeapUsage) {
            status = 'critical';
        } else if (usagePercent > MEMORY_CONFIG.warningThreshold) {
            status = 'warning';
        }
        
        return {
            status,
            usagePercent,
            recommendation: this.getRecommendation(status)
        };
    }
    
    /**
     * Get recommendation based on health status
     * @param {string} status - Health status
     * @returns {string} - Recommendation
     */
    getRecommendation(status) {
        switch (status) {
            case 'critical':
                return 'Immediate action required: Restart application or clear caches';
            case 'warning':
                return 'Monitor closely: Consider clearing caches or optimizing queries';
            case 'healthy':
                return 'Memory usage is normal';
            default:
                return 'Unknown status';
        }
    }
}

// Global memory manager instance
const memoryManager = new MemoryManager();

/**
 * Resource cleanup utilities
 */
export const resourceCleanup = {
    /**
     * Clean up all resources
     */
    async cleanupAll() {
        try {
            console.log('Starting comprehensive resource cleanup...');
            
            // Stop memory monitoring
            memoryManager.stopMonitoring();
            
            // Clear all caches
            cacheManager.clearAll();
            
            // Clear any global variables
            if (global.tempData) {
                global.tempData = {};
            }
            
            // Force garbage collection
            if (global.gc) {
                global.gc();
            }
            
            console.log('Resource cleanup completed');
            
        } catch (error) {
            console.error('Error during resource cleanup:', error);
        }
    },
    
    /**
     * Clean up specific resource type
     * @param {string} resourceType - Type of resource to clean
     */
    async cleanupResource(resourceType) {
        try {
            switch (resourceType) {
                case 'cache':
                    cacheManager.clearAll();
                    break;
                case 'memory':
                    if (global.gc) {
                        global.gc();
                    }
                    break;
                case 'temp':
                    if (global.tempData) {
                        global.tempData = {};
                    }
                    break;
                default:
                    console.warn(`Unknown resource type: ${resourceType}`);
            }
            
            console.log(`Resource cleanup completed for: ${resourceType}`);
            
        } catch (error) {
            console.error(`Error cleaning up resource ${resourceType}:`, error);
        }
    }
};

/**
 * Memory optimization utilities
 */
export const memoryOptimizer = {
    /**
     * Optimize memory usage
     */
    optimize() {
        try {
            console.log('Optimizing memory usage...');
            
            // Clear expired cache entries
            memoryManager.clearExpiredCache();
            
            // Perform garbage collection
            memoryManager.performGarbageCollection();
            
            // Clean up temporary data
            memoryManager.cleanupTemporaryData();
            
            console.log('Memory optimization completed');
            
        } catch (error) {
            console.error('Error optimizing memory:', error);
        }
    },
    
    /**
     * Get optimization recommendations
     * @returns {Array} - List of recommendations
     */
    getRecommendations() {
        const health = memoryManager.getHealthStatus();
        const recommendations = [];
        
        if (health.status === 'critical') {
            recommendations.push('Clear all caches immediately');
            recommendations.push('Restart application if possible');
            recommendations.push('Check for memory leaks');
        } else if (health.status === 'warning') {
            recommendations.push('Clear expired cache entries');
            recommendations.push('Monitor memory usage closely');
            recommendations.push('Consider optimizing database queries');
        }
        
        return recommendations;
    }
};

/**
 * Initialize memory management
 */
export function initializeMemoryManagement() {
    try {
        console.log('Initializing memory management...');
        
        // Start memory monitoring
        memoryManager.startMonitoring();
        
        // Set up process event handlers
        process.on('SIGINT', () => {
            console.log('Received SIGINT, cleaning up...');
            resourceCleanup.cleanupAll();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('Received SIGTERM, cleaning up...');
            resourceCleanup.cleanupAll();
            process.exit(0);
        });
        
        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
            resourceCleanup.cleanupAll();
            process.exit(1);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled rejection:', reason);
            // Don't exit on unhandled rejection, just log
        });
        
        console.log('Memory management initialized');
        
    } catch (error) {
        console.error('Error initializing memory management:', error);
    }
}

/**
 * Get memory manager instance
 * @returns {MemoryManager} - Memory manager instance
 */
export function getMemoryManager() {
    return memoryManager;
}

/**
 * Export memory management utilities
 */
export {
    memoryManager,
    MEMORY_CONFIG
};
