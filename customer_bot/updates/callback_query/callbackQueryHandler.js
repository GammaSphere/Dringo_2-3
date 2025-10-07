import Customer from "../../../schemas/customer.js";
import stateResolver from "../../resolvers/stateResolver.js";
import TelegramBot from "node-telegram-bot-api";
import { isUpdateStale } from "../../../utils/bootTime.js";

const bot = new TelegramBot(process.env.CUSTOMER_BOT_TOKEN);

export default async function callbackQueryHandler(query) {
    // Ignore stale callback queries created before the bot was up
    if (isUpdateStale(query.message?.date)) return;
    const customer = await Customer.findOne({ telegramId: query.from.id }).exec();
    if (!customer) {
        console.error("Unauthorized user trying to use bot");
        return;
    }
    query.user = customer;

    // Button debouncing - prevent rapid button presses
    const now = Date.now();
    const lastActionTime = customer.lastActionTime || 0;
    const cooldownPeriod = 300; // 300ms cooldown for faster response
    
    if (now - lastActionTime < cooldownPeriod) {
        console.log(`Button press too rapid, ignoring. Last action: ${now - lastActionTime}ms ago`);
        const { default: localizedString } = await import("../../../utils/localizedString.js");
        const waitText = await localizedString({ user: customer }, "Please wait...");
        await bot.answerCallbackQuery(query.id, {
            text: waitText,
            show_alert: false
        });
        return;
    }
    
    // Update last action time
    customer.lastActionTime = now;
    try {
        await customer.save();
    } catch (error) {
        console.error('Error saving lastActionTime:', error);
        // Continue execution even if save fails
    }

    // Methods
    query.answer = async (options) => await bot.answerCallbackQuery(query.id, options);

    query.edit = async (text, options = {}) => {
        await query.answer();
        options.message_id = query.message.message_id;
        options.chat_id = query.message.chat.id;
        options.parse_mode = options.parse_mode || 'HTML';
        options.disable_web_page_preview = options.disable_web_page_preview ?? true;
        if (query.message.text) return await bot.editMessageText(text, options);
        if (query.message.photo || query.message.video || query.message.document) return await bot.editMessageCaption(text, options);
    }

    query.delete = async () => {
        await query.answer();
        return await bot.deleteMessage(query.message.chat.id, query.message.message_id);
    }

    query.reply = async (text, options = {}) => {
        await query.answer();
        const response = await bot.sendMessage(query.from.id, text, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            ...options
        });
        query.user.lastSeenMessageId = response.message_id;
        await query.user.save();
        return response;
    }

    query.replyPhoto = async (photo, options = {}) => {
        await query.answer();
        await query.delete();
        const response = await bot.sendPhoto(query.from.id, photo, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            ...options
        });
        query.user.lastSeenMessageId = response.message_id;
        await query.user.save();
        return response;
    }

    return stateResolver(query);
}