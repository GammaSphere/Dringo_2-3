import {CALLBACK_QUERY} from "../../updates/updateTypes.js";
import {validateContextAndState} from "../../../utils/stateValidation.js";

export default async function(ctx, _this){
    // Validate that user is in correct state and using correct context type
    return await validateContextAndState(ctx, "product-details", CALLBACK_QUERY);
}