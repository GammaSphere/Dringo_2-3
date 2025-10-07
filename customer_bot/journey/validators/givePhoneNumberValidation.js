import {MESSAGE} from "../../updates/updateTypes.js";
import localizedString from "../../../utils/localizedString.js";

export default async function(ctx, _this){
    if (ctx.ctxType !== MESSAGE || (!ctx.text?.startsWith("+998") && !ctx.contact)) {
        const text = await localizedString(ctx, "You should send your number or tap 'Share my contact information'");
        const shareContactButtonText = await localizedString(ctx, "Share my contact information");
        await ctx.reply(text, {
            reply_markup: {
                keyboard: [
                    [{text: shareContactButtonText, request_contact: true}]
                ],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        });
        return false;
    }
    return true;
}