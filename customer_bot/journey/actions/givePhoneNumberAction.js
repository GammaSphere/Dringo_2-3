import fns from "../fns.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";

export default async function(ctx, _this){
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in ...status: "${_this.state}"`);
    if (ctx.contact) ctx.user.phoneNumber = ctx.contact.phone_number;
    if (ctx.text?.startsWith("+998") && ctx.text?.length === 13) ctx.user.phoneNumber = ctx.text;

    await saveWithRetry(ctx.user);
    await fns.writeYourFullName(ctx);
    await _this._updateCustomerData(ctx);
}