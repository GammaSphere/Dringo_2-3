import fns from "../fns.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";
import Order from "../../../schemas/order.js";
import { cancelPickupReminder } from "../../../utils/pickupReminder.js";

export default async function(ctx, _this) {
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in ...status: "${_this.state}"`);
    
    // Handle pickup confirmation
    if (ctx.data && ctx.data.startsWith("pickup_confirmed_")) {
        const orderId = ctx.data.split("pickup_confirmed_")[1];
        
        try {
            // Find the order
            const order = await Order.findById(orderId).populate('customer').exec();
            
            if (order) {
                // Update order status to completed
                order.status = "completed";
                await order.save();
                
                // Cancel any remaining pickup reminder for this order
                cancelPickupReminder(orderId, order.pickupTime);
                
                console.log(`✅ Order ${order.orderNumber} marked as completed by customer ${ctx.user.telegramId}`);
            }
            
        } catch (error) {
            console.error('Error updating order status:', error);
        }
        
        // Always try to delete the notification message (ignore errors)
        try {
            await ctx.delete();
        } catch (deleteError) {
            console.log('Notification message already deleted or not found (this is normal)');
        }
        
        // Always reset user to main menu and show it
        try {
            // Clear the cart after order completion (same as order details page)
            ctx.user.cart = [];
            ctx.user.state = "none";
            ctx.user.stateDetails = "none";
            await saveWithRetry(ctx.user);
            
            // Send main menu as a new message (since we deleted the original)
            const { default: localizedString } = await import("../../../utils/localizedString.js");
            const photo = "AgACAgIAAxkBAAIGX2jlC6u52l1QtJlkHMCAsafCLByzAALB9jEb9RQpS_Xo9hvZ7AABtAEAAwIAA20AAzYE";
            const text = await localizedString(ctx, "Welcome to Samad aka's Coffee Shop!");
            const productsButtonText = await localizedString(ctx, "☕️ Explore Products");
            const supportButtonText = await localizedString(ctx, "📞 Support");
            const settingsButtonText = await localizedString(ctx, "⚙️ Settings");
            
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [{text: productsButtonText, callback_data: "explore_products"}],
                        [{text: supportButtonText, callback_data: "support"}, {text: settingsButtonText, callback_data: "settings"}]
                    ]
                }
            };
            
            // Send as a new photo message (like /start command)
            await ctx.replyPhoto(photo, {caption: text, ...options});
            
            console.log(`✅ Main menu sent to customer ${ctx.user.telegramId} after pickup confirmation (cart cleared)`);
            
        } catch (menuError) {
            console.error('Error showing main menu:', menuError);
        }
    }
}
