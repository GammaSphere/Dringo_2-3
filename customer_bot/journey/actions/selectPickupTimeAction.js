import fns from "../fns.js";
import dayjs from "dayjs";
import saveWithRetry from "../../../utils/saveWithRetry.js";

export default async function(ctx, _this){
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in {...status: "${_this.state}"}`);
    
    // Handle refresh times button
    if (ctx.data === "refresh_times") {
        const { default: localizedString } = await import("../../../utils/localizedString.js");
        const refreshText = await localizedString(ctx, "Times refreshed!");
        await ctx.answer({ text: refreshText });
        await fns.showPickupTimes(ctx);
        return;
    }
    
    // Handle back button
    if (ctx.data === "back") {
        ctx.user.state = "review-cart";
        await saveWithRetry(ctx.user);
        await fns.showCartItems(ctx);
        return;
    }
    
    // Handle pickup time selection
    if (ctx.data.startsWith("pickup_")) {
        const pickupTime = ctx.data.split("pickup_")[1];
        
        // Check if the selected time is still valid (not in the past)
        const now = dayjs();
        const selectedTime = dayjs(pickupTime, "HH:mm");
        const currentTime = now.format("HH:mm");
        
        // If selected time is in the past, show error and refresh
        if (selectedTime.isBefore(now, "minute")) {
                const { default: localizedString } = await import("../../../utils/localizedString.js");
                const errorText = await localizedString(ctx, "This time is no longer available. Please select a new time.");
                await ctx.answer({
                    text: errorText,
                    show_alert: true
                });
            await fns.showPickupTimes(ctx);
            return;
        }
        
        ctx.user.state = "paying-for-order";
        ctx.user.stateDetails = pickupTime;
        await saveWithRetry(ctx.user);
        await fns.payForOrder(ctx);
    }
}