import localizedString from "../../../utils/localizedString.js";
import fns from "../fns.js";

export default async function acceptTermsAction(ctx, _this) {
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in ...status: "${_this.state}"`);
    if (ctx.data === "accept_terms") {
        let text = await localizedString(ctx, "Agreed to terms on {{date}}", {date: new Date().toDateString()})
        await ctx.edit(`${ctx.message.text}\n\n${text}`, {
            reply_markup: {
                inline_keyboard: [
                    [{text: "Terms", url: "https://example.com"}]
                ]
            }
        });
        await fns.chooseLanguage(ctx);
        await _this._updateCustomerData(ctx);
    } else {
        console.error(`Some other query was received in ...status: "${_this.state}"`);
    }
}