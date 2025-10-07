import {CALLBACK_QUERY} from "../../updates/updateTypes.js";

export default async function(ctx, _this) {
    // Only handle callback queries for pickup confirmation
    if (ctx.ctxType !== CALLBACK_QUERY) {
        return false;
    }
    
    // Check if this is a pickup confirmation callback
    if (!ctx.data || !ctx.data.startsWith("pickup_confirmed_")) {
        return false;
    }
    
    // Allow pickup confirmation from any state
    return true;
}
