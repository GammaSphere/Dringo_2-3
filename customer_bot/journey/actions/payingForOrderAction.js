import fns from "../fns.js";
import Order from "../../../schemas/order.js";
import generateOrderNumber from "../../../utils/generateOrderNumber.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";
import { executeWithRetry, handleExternalServiceError } from "../../../utils/errorRecovery.js";
import { schedulePickupReminder } from "../../../utils/pickupReminder.js";

export default async function(ctx, _this){
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in {...status: "${_this.state}"}`);
    if (ctx.data === "pay") {
        // Generate short, readable order number
        const orderNumber = await generateOrderNumber();
        
        const newOrder = new Order({
            orderNumber: orderNumber,
            customer: ctx.user._id,
            selectedProducts: ctx.user.cart,
            pickupTime: ctx.user.stateDetails
        });
        await newOrder.save();
        
        // Populate all order properties before sending HTTP request
        const populatedOrder = await Order.findById(newOrder._id)
            .populate({
                path: 'customer',
                select: 'telegramId fullName phoneNumber preferredLanguage agreedToTerms'
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
        
        // Send HTTP request to localhost:3000/order with retry logic
        const notificationResult = await executeWithRetry(
            async () => {
                const response = await fetch('http://localhost:3000/order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(populatedOrder)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response;
            },
            'api',
            ctx
        );
        
        if (notificationResult.success) {
            console.log('Order notification sent successfully');
        } else {
            console.error('Failed to send order notification:', notificationResult.error);
            await handleExternalServiceError(
                new Error(notificationResult.error), 
                ctx, 
                'order_notification'
            );
        }
        
        // Schedule pickup reminder
        try {
            const reminderResult = await schedulePickupReminder(populatedOrder);
            if (reminderResult.success) {
                console.log(`📅 Pickup reminder scheduled for order ${newOrder.orderNumber} at ${reminderResult.reminderTime}`);
            } else {
                console.log(`⚠️ Pickup reminder not scheduled for order ${newOrder.orderNumber}: ${reminderResult.reason}`);
            }
        } catch (reminderError) {
            console.error('Failed to schedule pickup reminder:', reminderError);
            // Don't fail the order if reminder scheduling fails
        }
        
        ctx.user.state = "waiting-for-order";
        ctx.user.stateDetails = newOrder.orderNumber; // Store short order number instead of ObjectId
        await saveWithRetry(ctx.user);
        await fns.waitForOrder(ctx);
    }
    if (ctx.data === "back") {
        ctx.user.state = "select-pickup-time";
        ctx.user.stateDetails = "none";
        await saveWithRetry(ctx.user);
        await fns.showPickupTimes(ctx);
    }
}