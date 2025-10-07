import Localization from "../schemas/localization.js";

export default async function localizedString(ctx, key, attributes = {}) {
    let loc = await Localization.findOne({ key }).exec();

    if (!loc) {
        loc = new Localization({
            key,
            translations: { en: key }
        });
        await loc.save();
    }

    const lang = ctx.user?.preferredLanguage || "en";
    let text = loc.translations.get(lang) || loc.translations.get("en");

    for (const [attrKey, value] of Object.entries(attributes)) {
        text = text.replace(new RegExp(`{{${attrKey}}}`, "g"), value);
    }

    return text;
};
