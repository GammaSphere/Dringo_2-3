import TelegramBot from "node-telegram-bot-api";
import Order from "../schemas/order.js";
import Customer from "../schemas/customer.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import localizedString from "./localizedString.js";

// Extend dayjs with custom parse format plugin
dayjs.extend(customParseFormat);

const botToken = process.env.CUSTOMER_BOT_TOKEN;
if (!botToken || botToken.trim().length === 0) {
    throw new Error('EFATAL: Telegram Bot Token not provided! Set CUSTOMER_BOT_TOKEN in environment.');
}

// Create a sender-only bot instance (no polling) for sending notifications
const bot = new TelegramBot(botToken, { polling: false });

// Store active reminders to avoid duplicates
const activeReminders = new Map();

/**
 * Schedule pickup reminder for an order
 * @param {Object} order - Order object with pickup time
 */
export async function schedulePickupReminder(order) {
    try {
        if (!order.pickupTime || !order.customer) {
            console.log('No pickup time or customer found for order:', order.orderNumber);
            return { success: false, reason: 'missing_data' };
        }

        // Parse pickup time (format: "HH:mm")
        const pickupTime = dayjs(order.pickupTime, "HH:mm");
        if (!pickupTime.isValid()) {
            console.log('Invalid pickup time format:', order.pickupTime);
            return { success: false, reason: 'invalid_time_format' };
        }

        // Calculate reminder time (5 minutes before pickup)
        const reminderTime = pickupTime.subtract(6, 'minute');
        const now = dayjs();

        // If reminder time is in the past, don't schedule
        if (reminderTime.isBefore(now)) {
            console.log('Pickup reminder time is in the past for order:', order.orderNumber);
            return { success: false, reason: 'time_in_past' };
        }

        // Calculate delay in milliseconds
        const delayMs = reminderTime.diff(now);
        
        console.log(`📅 Scheduled pickup reminder for order ${order.orderNumber} at ${reminderTime.format('HH:mm')} (${delayMs}ms delay)`);

        // Store reminder info
        const reminderId = `${order._id}_${order.pickupTime}`;
        activeReminders.set(reminderId, {
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerId: order.customer,
            pickupTime: order.pickupTime,
            scheduledAt: now.toISOString(),
            reminderAt: reminderTime.toISOString()
        });

        // Schedule the reminder
        setTimeout(async () => {
            await sendPickupReminder(order);
            // Remove from active reminders after sending
            activeReminders.delete(reminderId);
        }, delayMs);

        return { success: true, reminderTime: reminderTime.format('HH:mm') };

    } catch (error) {
        console.error('Error scheduling pickup reminder:', error);
        return { success: false, reason: 'error', error: error.message };
    }
}

/**
 * Send pickup reminder to customer
 * @param {Object} order - Order object
 */
async function sendPickupReminder(order) {
    try {
        // Populate customer data
        const populatedOrder = await Order.findById(order._id)
            .populate({
                path: 'customer',
                select: 'telegramId fullName phoneNumber preferredLanguage'
            })
            .populate({
                path: 'selectedProducts.product',
                populate: [
                    { path: 'title', select: 'key translations status' },
                    { path: 'description', select: 'key translations status' }
                ],
                select: 'title description sizeOptions defaultAddOns possibleAddOns status'
            })
            .exec();

        if (!populatedOrder || !populatedOrder.customer) {
            console.log('Order or customer not found for reminder:', order.orderNumber);
            return;
        }

        const customer = populatedOrder.customer;
        const telegramId = customer.telegramId;

        if (!telegramId) {
            console.log('No telegram ID found for customer:', customer._id);
            return;
        }

        // Create reminder message
        const reminderMessage = await createReminderMessage(populatedOrder);

        // Create inline keyboard with pickup confirmation button
        const inline_keyboard = [
            [{
                text: "✅ I have picked up my order",
                callback_data: `pickup_confirmed_${order._id}`
            }]
        ];

        // Send reminder with button
        await bot.sendMessage(telegramId, reminderMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: inline_keyboard
            }
        });

        console.log(`✅ Pickup reminder sent to customer ${telegramId} for order ${order.orderNumber}`);

    } catch (error) {
        console.error('Error sending pickup reminder:', error);
        
        // Handle specific Telegram errors
        if (error.response?.error_code === 403) {
            console.log('Customer blocked the bot, skipping reminder');
        } else if (error.response?.error_code === 400) {
            console.log('Invalid chat ID, skipping reminder');
        } else {
            console.error('Failed to send pickup reminder:', error.message);
        }
    }
}

/**
 * Create reminder message for customer
 * @param {Object} order - Populated order object
 * @returns {string} - Formatted reminder message
 */
async function createReminderMessage(order) {
    const customer = order.customer;
    const ctx = { user: customer };

    // Create order summary
    let orderSummary = "";
    if (order.selectedProducts && order.selectedProducts.length > 0) {
        orderSummary = order.selectedProducts.map((item, index) => {
            const productName = resolveLocalizedText(ctx, item.product?.title) || 'Unknown Product';
            const quantity = item.quantity;
            const size = item.sizeOption.size;
            const price = item.totalPrice;
            
            return `• ${productName} (${size}) x${quantity} - ${price.toLocaleString('en-US')} UZS`;
        }).join('\n');
    }

    const totalPrice = order.selectedProducts?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;

    const message = `⏰ <b>Pickup Reminder</b>

Your order is ready for pickup in 5 minutes!

📋 <b>Order Information:</b>
Order Number: ${order.orderNumber}
<b>Pickup Time: ${order.pickupTime}</b>

<b>Items:</b>
${orderSummary}

Total Amount: ${totalPrice.toLocaleString('en-US')} UZS

📍 Please come to Samad aka's Coffee Shop
💳 <b>Don't forget to bring your payment screenshot</b>`;

    return message;
}

/**
 * Resolve localized text from localization object
 * @param {Object} ctx - Context with user language
 * @param {Object} localization - Localization object
 * @returns {string} - Resolved text
 */
function resolveLocalizedText(ctx, localization) {
    if (!localization) return null;
    
    const userLang = ctx.user?.preferredLanguage || 'en';
    
    if (localization.translations && localization.translations[userLang]) {
        return localization.translations[userLang];
    }
    
    // Fallback to English
    if (localization.translations && localization.translations.en) {
        return localization.translations.en;
    }
    
    // Fallback to key
    return localization.key || null;
}

/**
 * Cancel pickup reminder for an order
 * @param {string} orderId - Order ID
 * @param {string} pickupTime - Pickup time
 */
export function cancelPickupReminder(orderId, pickupTime) {
    const reminderId = `${orderId}_${pickupTime}`;
    if (activeReminders.has(reminderId)) {
        activeReminders.delete(reminderId);
        console.log(`❌ Cancelled pickup reminder for order ${orderId}`);
    }
}

/**
 * Get all active reminders (for debugging)
 * @returns {Array} - Array of active reminders
 */
export function getActiveReminders() {
    return Array.from(activeReminders.values());
}

/**
 * Initialize pickup reminder system
 * This function should be called when the bot starts to schedule reminders for existing orders
 */
export async function initializePickupReminders() {
    try {
        console.log('🔄 Initializing pickup reminder system...');
        
        // Find all orders with pickup times in the future
        const now = dayjs();
        const futureOrders = await Order.find({
            status: { $in: ['waiting-for-receipt', 'ready'] },
            pickupTime: { $exists: true, $ne: null }
        }).populate('customer', 'telegramId').exec();

        let scheduledCount = 0;
        
        for (const order of futureOrders) {
            if (!order.pickupTime || !order.customer) continue;
            
            // Skip orders without proper order numbers (old orders from before orderNumber was implemented)
            if (!order.orderNumber || order.orderNumber === 'undefined' || order.orderNumber === 'UNDEFINED') {
                console.log(`⚠️ Skipping order without proper order number: ${order._id}`);
                continue;
            }
            
            const pickupTime = dayjs(order.pickupTime, "HH:mm");
            if (!pickupTime.isValid()) continue;
            
            // Only schedule if pickup time is in the future
            if (pickupTime.isAfter(now)) {
                const result = await schedulePickupReminder(order);
                if (result.success) {
                    scheduledCount++;
                }
            }
        }
        
        console.log(`✅ Initialized pickup reminder system. Scheduled ${scheduledCount} reminders.`);
        
    } catch (error) {
        console.error('Error initializing pickup reminders:', error);
    }
}

/**
 * Clean up old reminders (should be called periodically)
 */
export function cleanupOldReminders() {
    const now = dayjs();
    let cleanedCount = 0;
    
    for (const [reminderId, reminder] of activeReminders.entries()) {
        const reminderTime = dayjs(reminder.reminderAt);
        if (reminderTime.isBefore(now)) {
            activeReminders.delete(reminderId);
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} old reminders`);
    }
}

/**
 * Clean up old orders without proper order numbers
 * This should be called once to clean up legacy data
 */
export async function cleanupOldOrders() {
    try {
        console.log('🧹 Cleaning up old orders without proper order numbers...');
        
        const result = await Order.updateMany(
            {
                $or: [
                    { orderNumber: { $exists: false } },
                    { orderNumber: null },
                    { orderNumber: 'undefined' },
                    { orderNumber: 'UNDEFINED' }
                ]
            },
            {
                $set: { status: 'completed' }
            }
        );
        
        console.log(`✅ Updated ${result.modifiedCount} old orders to completed status`);
        return result.modifiedCount;
        
    } catch (error) {
        console.error('Error cleaning up old orders:', error);
        return 0;
    }
}