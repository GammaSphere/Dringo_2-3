import {CALLBACK_QUERY, MESSAGE} from "../../updates/updateTypes.js";
import {validateUserState} from "../../../utils/stateValidation.js";
import fns from "../fns.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";

export default async function(ctx, _this) {
    // Handle /start command from any state
    if (ctx.ctxType === MESSAGE && ctx.text === "/start") {
        // Reset user to main menu
        ctx.user.state = "none";
        ctx.user.stateDetails = "none";
        await saveWithRetry(ctx.user);
        await fns.displayMain(ctx);
        return false;
    }
    
    // First validate user is in correct state
    const isValidState = await validateUserState(ctx, "none");
    if (!isValidState) {
        return false;
    }
    
    // Then check context type
    if (ctx.ctxType !== CALLBACK_QUERY) {
        await fns.selectOneOptionValidation(ctx);
        await fns.displayMain(ctx);
        return false;
    }
    return true;
}