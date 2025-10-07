import fns from "../fns.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";

export default async function(ctx, _this){
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in ...status: "${_this.state}"`);
    if (ctx.data !== "back") {
        ctx.user.preferredLanguage = ctx.data;
    }
    ctx.user.state = "settings";
    await saveWithRetry(ctx.user);
    await fns.showSettings(ctx);
}