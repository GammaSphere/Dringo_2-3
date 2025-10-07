import messageHandler from "./message/messageHandler.js";
import callbackQueryHandler from "./callback_query/callbackQueryHandler.js";
import {CALLBACK_QUERY, MESSAGE} from "./updateTypes.js";

export default function updateHandler(type, ctx) {

    ctx.ctxType = type;

    if (type === MESSAGE) return messageHandler(ctx);
    if (type === CALLBACK_QUERY) return callbackQueryHandler(ctx);

    console.log("Something else happened");
};