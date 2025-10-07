/**
 * Generates a short, readable order number
 * Format: DR-YYYYMMDD-XXX
 * Example: DR-20250130-001
 * 
 * @returns {Promise<string>} - Generated order number
 */
export default async function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Get today's date string
    const dateString = `${year}${month}${day}`;
    
    // Import Order model here to avoid circular dependency
    const { default: Order } = await import('../schemas/order.js');
    
    // Count orders created today
    const startOfDay = new Date(year, now.getMonth(), now.getDate());
    const endOfDay = new Date(year, now.getMonth(), now.getDate() + 1);
    
    const todayOrdersCount = await Order.countDocuments({
        createdAt: {
            $gte: startOfDay,
            $lt: endOfDay
        }
    });
    
    // Generate sequence number (001, 002, 003, etc.)
    const sequenceNumber = String(todayOrdersCount + 1).padStart(3, '0');
    
    // Return formatted order number
    return `DR-${dateString}-${sequenceNumber}`;
}
