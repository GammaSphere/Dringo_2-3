import {CALLBACK_QUERY} from "../../updates/updateTypes.js";
import {validateUserState} from "../../../utils/stateValidation.js";
import localizedString from "../../../utils/localizedString.js";

export default async function acceptTermsValidation(ctx, _this) {
    // First validate user is in correct state
    const isValidState = await validateUserState(ctx, "accepting-terms");
    if (!isValidState) {
        return false;
    }
    
    // Then check context type and show terms if needed
    if (ctx.ctxType !== CALLBACK_QUERY) {
        let text = await localizedString(ctx, "You cannot send any messages right now! To continue using this bot, please agree to our Terms!");
        await ctx.reply(text);
        text = await localizedString(ctx, "Do you accept these terms?");
        await ctx.reply(text, {
            reply_markup: {
                inline_keyboard: [
                    [{text: "Terms", url: "https://example.com"}],
                    [{text: "✅ I agree", callback_data: "accept_terms"}]
                ]
            }
        });
        return false;
    }
    return true;
}