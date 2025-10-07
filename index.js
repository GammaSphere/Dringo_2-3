import 'dotenv/config'
import TelegramBot from "node-telegram-bot-api";
import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import updateHandler from "./customer_bot/updates/updateHandler.js";
import {CALLBACK_QUERY, MESSAGE} from "./customer_bot/updates/updateTypes.js";
import addProduct from "./api/addProduct.js";
import getOrders from "./api/getOrders.js";
import orderNotification from "./api/orderNotification.js";
import Customer from "./schemas/customer.js";
// Memory optimization imports disabled for better performance
// import { initializeMemoryManagement } from "./utils/memoryManager.js";
// import { initializeEdgeCaseHandling } from "./utils/edgeCaseHandler.js";
// import { initializeMonitoring } from "./utils/monitoringLogger.js";

const botToken = process.env.CUSTOMER_BOT_TOKEN;
if (!botToken || botToken.trim().length === 0) {
    console.error('EFATAL: Telegram Bot Token not provided! Set CUSTOMER_BOT_TOKEN in environment.');
    process.exit(1);
}

const customerBot = new TelegramBot(botToken, { polling: true });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(addProduct);
app.use(getOrders);
app.use(orderNotification);

// Add error handling to prevent crashes
customerBot.on(MESSAGE, async (msg) => {
    try {
        await updateHandler(MESSAGE, msg);
    } catch (error) {
        console.error('Error handling message:', error);
        // Optionally send friendly error message to user
        try {
                   const { default: localizedString } = await import("./utils/localizedString.js");
                   const errorText = await localizedString({ user: { preferredLanguage: 'en' } }, "⚠️ Oops! Something went wrong. Please try again.");
                   await customerBot.sendMessage(
                       msg.chat.id,
                       errorText + "\n\nPlease try again in a moment, or tap <b>/start</b> to continue.",
                       { parse_mode: 'HTML', disable_web_page_preview: true }
                   );
        } catch (sendError) {
            console.error('Error sending error message:', sendError);
        }
    }
});

customerBot.on(CALLBACK_QUERY, async (query) => {
    try {
        await updateHandler(CALLBACK_QUERY, query);
    } catch (error) {
        console.error('Error handling callback query:', error);
        // Acknowledge the callback query to remove loading state
        try {
            await customerBot.answerCallbackQuery(query.id, {
                text: "⚠️ Oops! Something went wrong. Please try again.",
                show_alert: true
            });
        } catch (ackError) {
            console.error('Error acknowledging callback query:', ackError);
        }
    }
});

// Log polling errors with details to diagnose network/auth issues
customerBot.on('polling_error', (err) => {
    console.error('error: [polling_error]', JSON.stringify({
        code: err?.code,
        name: err?.name,
        message: err?.message,
        cause: err?.cause?.message || err?.cause
    }));
});

mongoose.connect("mongodb://127.0.0.1:27017/dringo-lite")
    .then(async () => {
        console.log("MongoDB Connected");
        
        // Initialize menu with latest configuration
        try {
            const { initializeMenu } = await import('./utils/menuInitializer.js');
            await initializeMenu();
        } catch (menuError) {
            console.error('Failed to initialize menu:', menuError);
        }
        
        // Memory optimization disabled for better performance
        // initializeMemoryManagement();
        // initializeEdgeCaseHandling();
        // initializeMonitoring({
        //     logLevel: 'INFO',
        //     logFile: 'logs/bot.log'
        // });
        // Broadcast friendly startup notification
        const text = "🎉 <b>Samad aka is back!</b> 🎉\n\n" +
            "We're back online and ready to serve you amazing coffee! ☕️\n\n" +
            "To start preordering, simply type <b>/start</b>";
        try {
            const customers = await Customer.find({}, { telegramId: 1 }).lean();
            for (const c of customers) {
                if (!c?.telegramId) continue;
                try {
                    await customerBot.sendMessage(c.telegramId, text, {
                        parse_mode: 'HTML',
                        disable_web_page_preview: true,
                        reply_markup: {
                            keyboard: [[{ text: '/start' }]],
                            resize_keyboard: true,
                            one_time_keyboard: true
                        }
                    });
                } catch (sendErr) {
                    console.error('Startup notify send error for', c.telegramId, sendErr?.message || sendErr);
                }
                await new Promise(r => setTimeout(r, 50));
            }
            console.log(`Startup broadcast sent to ${customers.length} customers`);
        } catch (e) {
            console.error('Startup broadcast failed:', e);
        }
        
        // Initialize pickup reminder system
        try {
            const { initializePickupReminders, cleanupOldReminders } = await import('./utils/pickupReminder.js');
            await initializePickupReminders();
            
            // Set up periodic cleanup of old reminders (every 10 minutes)
            setInterval(() => {
                cleanupOldReminders();
            }, 10 * 60 * 1000);
            
        } catch (reminderError) {
            console.error('Failed to initialize pickup reminders:', reminderError);
        }
    })
    .catch(err => console.error(err));

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit the process for MongoDB version errors
    if (error.name !== 'VersionError') {
        process.exit(1);
    }
});

const server = app.listen(process.env.PORT, () => {
    console.log("Server started on port " + process.env.PORT);
});

async function broadcastBreakAndShutdown(signal) {
    console.log(`Received ${signal}. Notifying users and shutting down...`);
    const breakText = "🛑 <b>Samad aka is having a break</b>\n\n" +
        "We’re temporarily offline and not accepting orders at the moment.\n\n" +
        "Please check back soon — we’ll notify you when we’re back!";
    try {
        const customers = await Customer.find({}, { telegramId: 1 }).lean();
        for (const c of customers) {
            if (!c?.telegramId) continue;
            try {
                await customerBot.sendMessage(c.telegramId, breakText, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                });
            } catch (sendErr) {
                console.error('Break notify send error for', c.telegramId, sendErr?.message || sendErr);
            }
            await new Promise(r => setTimeout(r, 50));
        }
        console.log(`Break broadcast sent to ${customers.length} customers`);
    } catch (e) {
        console.error('Break broadcast failed:', e);
    }

    try { await customerBot.stopPolling(); } catch {}
    try { await mongoose.connection.close(); } catch {}
    server?.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000);
}

process.on('SIGINT', () => broadcastBreakAndShutdown('SIGINT'));
process.on('SIGTERM', () => broadcastBreakAndShutdown('SIGTERM'));