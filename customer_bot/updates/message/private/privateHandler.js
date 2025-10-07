import Customer from "../../../../schemas/customer.js";
import stateResolver from "../../../resolvers/stateResolver.js";
import TelegramBot from "node-telegram-bot-api";
import { isUpdateStale } from "../../../../utils/bootTime.js";

const token = process.env.CUSTOMER_BOT_TOKEN;
if (!token || token.trim().length === 0) {
    throw new Error('EFATAL: Telegram Bot Token not provided! Set CUSTOMER_BOT_TOKEN in environment.');
}
// Create a sender-only bot instance (no polling) for replying in private chats
const bot = new TelegramBot(token, { polling: false });

export default async function privateHandler(msg) {
    // Ignore stale updates created before the bot was up
    if (isUpdateStale(msg.date)) return;
    let customer = await Customer.findOne({ telegramId: msg.chat.id })
        .exec();
    if (!customer) {
        customer = new Customer({ telegramId: msg.chat.id });
        await customer.save();
    }
    msg.user = customer;

    // Methods
    msg.reply = async (text, options = {}) => {
        const response = await bot.sendMessage(msg.chat.id, text, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            ...options
        });
        msg.user.lastSeenMessageId = response.message_id;
        await msg.user.save();
        return response;
    };

    msg.replyPhoto = async (photo, options = {}) => {
        const response = await bot.sendPhoto(msg.chat.id, photo, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            ...options
        });
        msg.user.lastSeenMessageId = response.message_id;
        await msg.user.save();
        return response;
    }

    return stateResolver(msg);
};