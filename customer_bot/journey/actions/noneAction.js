import fns from "../fns.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";

export default async function(ctx, _this){
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in ...status: "${_this.state}"`);
    if (ctx.data === "explore_products") {
        ctx.user.state = "explore-products";
        await saveWithRetry(ctx.user);
        await fns.showProductsMenu(ctx);
    }
    if (ctx.data === "support") {
        ctx.user.state = "support";
        await saveWithRetry(ctx.user);
        await fns.contactSupport(ctx);
    }
    if (ctx.data === "settings") {
        ctx.user.state = "settings";
        await saveWithRetry(ctx.user);
        await fns.showSettings(ctx);
    }
}