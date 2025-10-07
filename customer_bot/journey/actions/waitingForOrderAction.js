import fns from "../fns.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";

export default async function(ctx, _this){
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in {...status: "${_this.state}"}`);
    if (ctx.data === "done") {
        // Clear the cart after order completion
        ctx.user.cart = [];
        ctx.user.state = "none";
        ctx.user.stateDetails = "none";
        await saveWithRetry(ctx.user);
        await fns.displayMain(ctx);
    }
}