/**
 * Comprehensive logging and monitoring utilities
 * Provides structured logging, performance monitoring, and system health tracking
 */

import fs from 'fs';
import path from 'path';

/**
 * Log levels
 */
export const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

/**
 * Log categories
 */
export const LOG_CATEGORIES = {
    SYSTEM: 'system',
    USER: 'user',
    DATABASE: 'database',
    TELEGRAM: 'telegram',
    PRINTER: 'printer',
    CACHE: 'cache',
    MEMORY: 'memory',
    ERROR: 'error',
    PERFORMANCE: 'performance'
};

/**
 * Comprehensive logging system
 */
class MonitoringLogger {
    constructor() {
        this.logLevel = LOG_LEVELS.INFO;
        this.logFile = null;
        this.logBuffer = [];
        this.maxBufferSize = 1000;
        this.flushInterval = 30000; // 30 seconds
        this.metrics = new Map();
        this.alerts = new Map();
        this.isInitialized = false;
    }
    
    /**
     * Initialize the logging system
     * @param {Object} options - Configuration options
     */
    initialize(options = {}) {
        try {
            this.logLevel = options.logLevel || LOG_LEVELS.INFO;
            this.logFile = options.logFile || 'logs/bot.log';
            
            // Create logs directory if it doesn't exist
            const logDir = path.dirname(this.logFile);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            
            // Set up periodic flush
            setInterval(() => {
                this.flushLogs();
            }, this.flushInterval);
            
            this.isInitialized = true;
            this.info('MonitoringLogger initialized', LOG_CATEGORIES.SYSTEM);
            
        } catch (error) {
            console.error('Failed to initialize MonitoringLogger:', error);
        }
    }
    
    /**
     * Log a message
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {string} category - Log category
     * @param {Object} metadata - Additional metadata
     */
    log(level, message, category = LOG_CATEGORIES.SYSTEM, metadata = {}) {
        if (LOG_LEVELS[level] > this.logLevel) {
            return;
        }
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            category,
            message,
            metadata,
            pid: process.pid,
            memory: process.memoryUsage()
        };
        
        // Add to buffer
        this.logBuffer.push(logEntry);
        
        // Console output for immediate visibility
        const consoleMessage = `[${logEntry.timestamp}] ${level.toUpperCase()} [${category}] ${message}`;
        switch (level) {
            case 'ERROR':
                console.error(consoleMessage, metadata);
                break;
            case 'WARN':
                console.warn(consoleMessage, metadata);
                break;
            case 'DEBUG':
                console.debug(consoleMessage, metadata);
                break;
            default:
                console.log(consoleMessage, metadata);
        }
        
        // Flush if buffer is full
        if (this.logBuffer.length >= this.maxBufferSize) {
            this.flushLogs();
        }
        
        // Update metrics
        this.updateMetrics(level, category);
    }
    
    /**
     * Log error message
     * @param {string} message - Error message
     * @param {string} category - Log category
     * @param {Object} metadata - Additional metadata
     */
    error(message, category = LOG_CATEGORIES.ERROR, metadata = {}) {
        this.log('ERROR', message, category, metadata);
    }
    
    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {string} category - Log category
     * @param {Object} metadata - Additional metadata
     */
    warn(message, category = LOG_CATEGORIES.SYSTEM, metadata = {}) {
        this.log('WARN', message, category, metadata);
    }
    
    /**
     * Log info message
     * @param {string} message - Info message
     * @param {string} category - Log category
     * @param {Object} metadata - Additional metadata
     */
    info(message, category = LOG_CATEGORIES.SYSTEM, metadata = {}) {
        this.log('INFO', message, category, metadata);
    }
    
    /**
     * Log debug message
     * @param {string} message - Debug message
     * @param {string} category - Log category
     * @param {Object} metadata - Additional metadata
     */
    debug(message, category = LOG_CATEGORIES.SYSTEM, metadata = {}) {
        this.log('DEBUG', message, category, metadata);
    }
    
    /**
     * Flush logs to file
     */
    flushLogs() {
        if (!this.isInitialized || this.logBuffer.length === 0) {
            return;
        }
        
        try {
            const logEntries = this.logBuffer.splice(0);
            const logText = logEntries.map(entry => 
                JSON.stringify(entry)
            ).join('\n') + '\n';
            
            fs.appendFileSync(this.logFile, logText);
            
        } catch (error) {
            console.error('Failed to flush logs:', error);
        }
    }
    
    /**
     * Update metrics
     * @param {string} level - Log level
     * @param {string} category - Log category
     */
    updateMetrics(level, category) {
        const key = `${level}_${category}`;
        const current = this.metrics.get(key) || 0;
        this.metrics.set(key, current + 1);
        
        // Check for alert conditions
        this.checkAlerts(level, category, current + 1);
    }
    
    /**
     * Check for alert conditions
     * @param {string} level - Log level
     * @param {string} category - Log category
     * @param {number} count - Current count
     */
    checkAlerts(level, category, count) {
        // Alert on high error rates
        if (level === 'ERROR' && count > 10) {
            this.triggerAlert('HIGH_ERROR_RATE', {
                level,
                category,
                count,
                message: `High error rate detected: ${count} errors in ${category}`
            });
        }
        
        // Alert on memory issues
        if (category === LOG_CATEGORIES.MEMORY && level === 'WARN') {
            this.triggerAlert('MEMORY_WARNING', {
                level,
                category,
                count,
                message: 'Memory usage warning triggered'
            });
        }
    }
    
    /**
     * Trigger an alert
     * @param {string} alertType - Type of alert
     * @param {Object} alertData - Alert data
     */
    triggerAlert(alertType, alertData) {
        const alertKey = `${alertType}_${Date.now()}`;
        this.alerts.set(alertKey, {
            ...alertData,
            timestamp: new Date().toISOString(),
            alertType
        });
        
        this.error(`ALERT: ${alertData.message}`, LOG_CATEGORIES.SYSTEM, alertData);
        
        // Clean up old alerts
        this.cleanupOldAlerts();
    }
    
    /**
     * Clean up old alerts
     */
    cleanupOldAlerts() {
        const oneHourAgo = Date.now() - 3600000;
        
        for (const [key, alert] of this.alerts.entries()) {
            if (new Date(alert.timestamp).getTime() < oneHourAgo) {
                this.alerts.delete(key);
            }
        }
    }
    
    /**
     * Get metrics summary
     * @returns {Object} - Metrics summary
     */
    getMetrics() {
        const metrics = {};
        
        for (const [key, value] of this.metrics.entries()) {
            metrics[key] = value;
        }
        
        return {
            metrics,
            alerts: Array.from(this.alerts.values()),
            bufferSize: this.logBuffer.length,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
    }
    
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics.clear();
        this.alerts.clear();
        this.info('Metrics reset', LOG_CATEGORIES.SYSTEM);
    }
}

// Global logger instance
const logger = new MonitoringLogger();

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
    /**
     * Monitor function execution time
     * @param {string} operation - Operation name
     * @param {Function} fn - Function to monitor
     * @returns {Promise<any>} - Function result
     */
    async monitor(operation, fn) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage();
        
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            const endMemory = process.memoryUsage();
            
            logger.info(`Operation completed: ${operation}`, LOG_CATEGORIES.PERFORMANCE, {
                duration,
                memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
                operation
            });
            
            // Log slow operations
            if (duration > 1000) {
                logger.warn(`Slow operation detected: ${operation}`, LOG_CATEGORIES.PERFORMANCE, {
                    duration,
                    operation
                });
            }
            
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            logger.error(`Operation failed: ${operation}`, LOG_CATEGORIES.PERFORMANCE, {
                duration,
                error: error.message,
                operation
            });
            
            throw error;
        }
    },
    
    /**
     * Monitor database query performance
     * @param {string} query - Query description
     * @param {Function} queryFn - Query function
     * @returns {Promise<any>} - Query result
     */
    async monitorQuery(query, queryFn) {
        return this.monitor(`DB_QUERY_${query}`, queryFn);
    },
    
    /**
     * Monitor API call performance
     * @param {string} endpoint - API endpoint
     * @param {Function} apiCall - API call function
     * @returns {Promise<any>} - API result
     */
    async monitorApiCall(endpoint, apiCall) {
        return this.monitor(`API_CALL_${endpoint}`, apiCall);
    }
};

/**
 * User activity monitoring
 */
export const userActivityMonitor = {
    /**
     * Log user action
     * @param {Object} ctx - User context
     * @param {string} action - Action performed
     * @param {Object} metadata - Additional metadata
     */
    logUserAction(ctx, action, metadata = {}) {
        logger.info(`User action: ${action}`, LOG_CATEGORIES.USER, {
            userId: ctx.user?.telegramId,
            state: ctx.user?.state,
            action,
            ...metadata
        });
    },
    
    /**
     * Log user error
     * @param {Object} ctx - User context
     * @param {string} error - Error message
     * @param {Object} metadata - Additional metadata
     */
    logUserError(ctx, error, metadata = {}) {
        logger.error(`User error: ${error}`, LOG_CATEGORIES.USER, {
            userId: ctx.user?.telegramId,
            state: ctx.user?.state,
            error,
            ...metadata
        });
    },
    
    /**
     * Log user state transition
     * @param {Object} ctx - User context
     * @param {string} fromState - Previous state
     * @param {string} toState - New state
     * @param {Object} metadata - Additional metadata
     */
    logStateTransition(ctx, fromState, toState, metadata = {}) {
        logger.info(`State transition: ${fromState} -> ${toState}`, LOG_CATEGORIES.USER, {
            userId: ctx.user?.telegramId,
            fromState,
            toState,
            ...metadata
        });
    }
};

/**
 * System health monitoring
 */
export const systemHealthMonitor = {
    /**
     * Monitor system health
     * @returns {Object} - Health status
     */
    getHealthStatus() {
        const memUsage = process.memoryUsage();
        const uptime = process.uptime();
        
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime,
            memory: {
                used: memUsage.heapUsed,
                total: memUsage.heapTotal,
                usagePercent: memUsage.heapUsed / memUsage.heapTotal
            },
            metrics: logger.getMetrics()
        };
        
        // Determine health status
        if (health.memory.usagePercent > 0.9) {
            health.status = 'critical';
        } else if (health.memory.usagePercent > 0.7) {
            health.status = 'warning';
        }
        
        return health;
    },
    
    /**
     * Log system health
     */
    logSystemHealth() {
        const health = this.getHealthStatus();
        
        logger.info('System health check', LOG_CATEGORIES.SYSTEM, health);
        
        if (health.status === 'critical') {
            logger.error('System health critical', LOG_CATEGORIES.SYSTEM, health);
        } else if (health.status === 'warning') {
            logger.warn('System health warning', LOG_CATEGORIES.SYSTEM, health);
        }
    }
};

/**
 * Database monitoring
 */
export const databaseMonitor = {
    /**
     * Log database operation
     * @param {string} operation - Database operation
     * @param {string} collection - Collection name
     * @param {Object} metadata - Additional metadata
     */
    logDatabaseOperation(operation, collection, metadata = {}) {
        logger.info(`Database operation: ${operation}`, LOG_CATEGORIES.DATABASE, {
            operation,
            collection,
            ...metadata
        });
    },
    
    /**
     * Log database error
     * @param {string} operation - Database operation
     * @param {string} collection - Collection name
     * @param {Error} error - Database error
     * @param {Object} metadata - Additional metadata
     */
    logDatabaseError(operation, collection, error, metadata = {}) {
        logger.error(`Database error: ${operation}`, LOG_CATEGORIES.DATABASE, {
            operation,
            collection,
            error: error.message,
            ...metadata
        });
    }
};

/**
 * Telegram API monitoring
 */
export const telegramMonitor = {
    /**
     * Log Telegram API call
     * @param {string} method - API method
     * @param {Object} metadata - Additional metadata
     */
    logApiCall(method, metadata = {}) {
        logger.info(`Telegram API call: ${method}`, LOG_CATEGORIES.TELEGRAM, {
            method,
            ...metadata
        });
    },
    
    /**
     * Log Telegram API error
     * @param {string} method - API method
     * @param {Error} error - API error
     * @param {Object} metadata - Additional metadata
     */
    logApiError(method, error, metadata = {}) {
        logger.error(`Telegram API error: ${method}`, LOG_CATEGORIES.TELEGRAM, {
            method,
            error: error.message,
            ...metadata
        });
    }
};

/**
 * Initialize monitoring and logging
 * @param {Object} options - Configuration options
 */
export function initializeMonitoring(options = {}) {
    try {
        logger.initialize(options);
        
        // Set up periodic health checks
        setInterval(() => {
            systemHealthMonitor.logSystemHealth();
        }, 60000); // 1 minute
        
        // Set up periodic metrics logging
        setInterval(() => {
            const metrics = logger.getMetrics();
            logger.info('System metrics', LOG_CATEGORIES.SYSTEM, metrics);
        }, 300000); // 5 minutes
        
        logger.info('Monitoring and logging initialized', LOG_CATEGORIES.SYSTEM);
        
    } catch (error) {
        console.error('Failed to initialize monitoring:', error);
    }
}

/**
 * Get logger instance
 * @returns {MonitoringLogger} - Logger instance
 */
export function getLogger() {
    return logger;
}

/**
 * Export monitoring utilities
 */
export {
    logger
};
