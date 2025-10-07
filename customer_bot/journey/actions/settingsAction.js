import fns from "../fns.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";

export default async function(ctx, _this){
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in ...status: "${_this.state}"`);
    if (ctx.data === "back") {
        await fns.displayMain(ctx);
        await _this._updateCustomerData(ctx);
    }
    if (ctx.data === "change_language") {
        ctx.user.state = "changing-language";
        await saveWithRetry(ctx.user);
        await fns.showInlineLanguageSettings(ctx);
    }
}