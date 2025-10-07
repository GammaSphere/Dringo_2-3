import localizedString from "../../../utils/localizedString.js";

export default async function(ctx, _this) {
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in {...status: "${_this.state}"}`);
    const text = await localizedString(ctx, "Do you accept these terms?");
    await ctx.reply(text, {
        reply_markup: {
            inline_keyboard: [
                [{text: await localizedString(ctx, "Terms"), url: "https://example.com"}],
                [{text: await localizedString(ctx, "✅ I agree"), callback_data: "accept_terms"}]
            ]
        }
    });
    await _this._updateCustomerData(ctx);
}