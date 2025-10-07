import fns from "../fns.js";

export default async function(ctx, _this){
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in ...status: "${_this.state}"`);
    if (ctx.data === "back") {
        await fns.displayMain(ctx);
        await _this._updateCustomerData(ctx);
    }
}