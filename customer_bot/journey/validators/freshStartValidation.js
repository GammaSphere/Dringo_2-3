import {MESSAGE} from "../../updates/updateTypes.js";
import localizedString from "../../../utils/localizedString.js";

export default async function(ctx, _this) {
    if (ctx.ctxType !== MESSAGE) {
        const text = await localizedString(ctx, "Unknown error, please contact support for that");
        await ctx.reply(text);
        return false;
    }
    return true;
}