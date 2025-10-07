import journeyPath from "../journey/customerJourney.js";
import {CALLBACK_QUERY} from "../updates/updateTypes.js";

export default function stateResolver(ctx) {
    if (!ctx.user) return console.error("Error getting a user in context");
    
    // Handle pickup confirmation from any state
    if (ctx.ctxType === CALLBACK_QUERY && ctx.data && ctx.data.startsWith("pickup_confirmed_")) {
        const pickupConfirmedPath = journeyPath.find(p => p.state === "pickup-confirmed");
        if (pickupConfirmedPath) {
            return pickupConfirmedPath.action(ctx);
        }
    }
    
    const currentPath = journeyPath.find(p => p.state === ctx.user.state);
    return currentPath.action(ctx);
}