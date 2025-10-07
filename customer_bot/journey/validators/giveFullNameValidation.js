import {MESSAGE} from "../../updates/updateTypes.js";
import fns from "../fns.js";

export default async function(ctx, _this){
    if (ctx.ctxType !== MESSAGE || !ctx.text) {
        await fns.writeYourFullName(ctx);
        return false;
    }
    return true;
}