import {MESSAGE} from "../../updates/updateTypes.js";
import fns from "../fns.js";
import {ENGLISH_LANGUAGE_TEXT, RUSSIAN_LANGUAGE_TEXT, UZBEK_LANGUAGE_TEXT} from "../keyboardButtonTextConstants.js";

export default async function chooseLanguageValidation(ctx) {
    if (ctx.ctxType !== MESSAGE || (ctx.text !== RUSSIAN_LANGUAGE_TEXT && ctx.text !== UZBEK_LANGUAGE_TEXT && ctx.text !== ENGLISH_LANGUAGE_TEXT)) {
        await fns.selectOneOptionValidation(ctx);
        await fns.chooseLanguage(ctx);
        return false;
    }
    return true;
}