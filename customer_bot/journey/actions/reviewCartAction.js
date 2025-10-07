import fns from "../fns.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";

export default async function(ctx, _this){
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in {...status: "${_this.state}"}`);
    if (ctx.data === "back") {
        ctx.user.state = "explore-products";
        await saveWithRetry(ctx.user);
        await fns.showProductsMenu(ctx);
    }
    if (ctx.data === "select_pickup_time") {
        ctx.user.state = "select-pickup-time";
        await saveWithRetry(ctx.user);
        await fns.showPickupTimes(ctx);
    }
    if (ctx.data.startsWith("remove_")) {
        const removeData = ctx.data.split("_")[1];
        
        if (removeData === "all") {
            // Remove all items from cart
            ctx.user.cart = [];
            ctx.user.state = "none";
            ctx.user.stateDetails = "none";
            await saveWithRetry(ctx.user);
            await fns.displayMain(ctx);
        } else {
            // Remove specific item by index
            const cartIndex = parseInt(removeData);
            ctx.user.cart.splice(cartIndex, 1);
            await saveWithRetry(ctx.user);
            await fns.showCartItems(ctx);
        }
    }
}