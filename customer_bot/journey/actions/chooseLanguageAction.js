import localizedString from "../../../utils/localizedString.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";

export default async function chooseLanguageAction(ctx, _this) {
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in ...status: "${_this.state}"`);
    ctx.user.preferredLanguage = ctx.text === "🇷🇺 Русский" ? "ru" : ctx.text === "🇺🇿 O'zbek tili" ? "uz" : "en";
    await saveWithRetry(ctx.user);
    const text = await localizedString(ctx, "What is your Phone Number?\n\nShould start from +998");
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
    await _this._updateCustomerData(ctx);
}