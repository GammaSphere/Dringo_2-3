import {MESSAGE} from "../updates/updateTypes.js";
import localizedString from "../../utils/localizedString.js";
import {ENGLISH_LANGUAGE_TEXT, RUSSIAN_LANGUAGE_TEXT, UZBEK_LANGUAGE_TEXT} from "./keyboardButtonTextConstants.js";
import Product from "../../schemas/product.js";
import dayjs from "dayjs";
import Order from "../../schemas/order.js";

// Helper to safely resolve localized text from a Localization document
function resolveLocalizedText(ctx, loc) {
    const preferredLang = (ctx.user?.preferredLanguage || 'en').toLowerCase();
    if (!loc) return null;
    const translations = loc.translations;
    const getFromMap = (m, k) => {
        try { return typeof m?.get === 'function' ? m.get(k) : undefined; } catch { return undefined; }
    };
    const getFromObj = (o, k) => (o && typeof o === 'object') ? o[k] : undefined;
    return (
        getFromMap(translations, preferredLang)
        || getFromObj(translations, preferredLang)
        || getFromMap(translations, 'en')
        || getFromObj(translations, 'en')
        || loc.key
        || null
    );
}

// Helper to provide default descriptions for drinks
function getDefaultDescription(productName) {
    const name = productName.toLowerCase();
    
    // Coffee drinks
    if (name.includes('espresso')) return 'Strong, concentrated coffee shot';
    if (name.includes('americano')) return 'Espresso with hot water, smooth and bold';
    if (name.includes('latte')) return 'Espresso with steamed milk, creamy and mild';
    if (name.includes('cappuccino')) return 'Espresso with steamed milk foam, rich and frothy';
    if (name.includes('flat white')) return 'Espresso with microfoam milk, smooth texture';
    if (name.includes('raf')) return 'Creamy coffee with vanilla and cream';
    if (name.includes('bumble')) return 'Sweet coffee blend with caramel notes';
    
    // Hot drinks
    if (name.includes('hot chocolate')) return 'Rich, creamy chocolate drink';
    if (name.includes('kakao') || name.includes('cocoa')) return 'Warm chocolate drink, comforting';
    
    // Teas
    if (name.includes('black tea')) return 'Classic black tea, bold and aromatic';
    if (name.includes('green tea')) return 'Light green tea, fresh and healthy';
    if (name.includes('tea')) return 'Traditional tea blend';
    
    // Specialty drinks
    if (name.includes('iris')) return 'Premium drink with caramel flavor';
    if (name.includes('choco') && name.includes('mint')) return 'Chocolate drink with refreshing mint';
    if (name.includes('bounty') || name.includes('baunty')) return 'Coconut-flavored creamy drink';
    
    // Default
    return 'Delicious handcrafted beverage';
}

const fns = {
    async displayMain(ctx) {
        const photo = "AgACAgIAAxkBAAIGX2jlC6u52l1QtJlkHMCAsafCLByzAALB9jEb9RQpS_Xo9hvZ7AABtAEAAwIAA20AAzYE"; // File ID of photo
        const text = await localizedString(ctx, "Welcome to Samad aka's Coffee Shop!");
        const productsButtonText = await localizedString(ctx, "☕️ Explore Products");
        const supportButtonText = await localizedString(ctx, "📞 Support");
        const settingsButtonText = await localizedString(ctx, "⚙️ Settings")
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{text: productsButtonText, callback_data: "explore_products"}],
                    [{text: supportButtonText, callback_data: "support"}, {text: settingsButtonText, callback_data: "settings"}]
                ]
            }
        }
        if (ctx.ctxType !== MESSAGE) await ctx.edit(text, options);
        else await ctx.replyPhoto(photo, {caption: text, ...options});
    },
    async selectOneOptionValidation(ctx) {
        let text = await localizedString(ctx, `You should select one of the options`);
        await ctx.reply(text);
    },
    async chooseLanguage(ctx){
        const text = await localizedString(ctx, "Choose your language");
        await ctx.reply(text, {
            reply_markup: {
                keyboard: [
                    [{text: RUSSIAN_LANGUAGE_TEXT}],
                    [{text: UZBEK_LANGUAGE_TEXT}],
                    [{text: ENGLISH_LANGUAGE_TEXT}]
                ],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        });
    },
    async writeYourFullName(ctx){
        const text = await localizedString(ctx, "Write your Full Name");
        await ctx.reply(text);
    },
    async contactSupport(ctx){
        const text = await localizedString(ctx, "Please contact @dringo_uz for support");
        const backButtonText = await localizedString(ctx, "🔙 Back");
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{text: backButtonText, callback_data: "back"}]
                ]
            }
        };
        if (ctx.ctxType === MESSAGE) {
            await ctx.reply(text, options);
        } else {
            await ctx.edit(text, options);
        }
    },
    async showSettings(ctx){
        const text = await localizedString(ctx, "Settings:");
        const changeLanguageButtonText = await localizedString(ctx, "Change Language");
        const backButtonText = await localizedString(ctx, "🔙 Back");
        const options = {reply_markup: {
            inline_keyboard: [
                [{text: changeLanguageButtonText, callback_data: "change_language"}],
                [{text: backButtonText, callback_data: "back"}]
            ]
        }};
        if (ctx.ctxType === MESSAGE) {
            await ctx.reply(text, options);
        } else {
            await ctx.edit(text, options);
        }
    },
    async showInlineLanguageSettings(ctx){
        const text = await localizedString(ctx, "To which language you want to switch?");
        const russianButtonText = await localizedString(ctx, RUSSIAN_LANGUAGE_TEXT);
        const uzbekButtonText = await localizedString(ctx, UZBEK_LANGUAGE_TEXT);
        const englishButtonText = await localizedString(ctx, ENGLISH_LANGUAGE_TEXT);
        const backButtonText = await localizedString(ctx, "🔙 Back");
        await ctx.edit(text, {
            reply_markup: {
                inline_keyboard: [
                    [{text: russianButtonText, callback_data: "ru"}],
                    [{text: uzbekButtonText, callback_data: "uz"}],
                    [{text: englishButtonText, callback_data: "en"}],
                    [{text: backButtonText, callback_data: "back"}]
                ]
            }
        });
    },
    async showProductsMenu(ctx){
        const headerText = await localizedString(ctx, "This is current menu:\n\n");
        const backButtonText = await localizedString(ctx, "🔙 Back");
        const goToCartText = await localizedString(ctx, "🛒 Cart");
        
        // Use optimized product query with caching
        const { getProductsOptimized } = await import("../../utils/databaseOptimization.js");
        const products = await getProductsOptimized(
            { status: "active" },
            { populate: true, lean: false }
        );
        
        // Get cart items to check which products are in cart
        const cartItems = ctx.user.cart;
        console.log(`ShowProductsMenu - Cart items count: ${cartItems.length}`);
        console.log(`Cart product IDs: ${cartItems.map(item => item.product.toString()).join(', ')}`);
        
        const listOfProductsText = products.map((p, i) => {
            const number = i + 1;
            const name = resolveLocalizedText(ctx, p.title) || 'Unnamed product';
            return `${number}. ${name}`;
        });
        let inline_keyboard = [];
        const rowSize = 5;

        for (let i = 0; i < products.length; i += rowSize) {
            const row = products.slice(i, i + rowSize).map((p, idx) => {
                const number = i + idx + 1;
                // Check if this specific product exists in cart
                const exists = cartItems.some(cartItem => 
                    cartItem.product.toString() === p._id.toString()
                );
                console.log(`Product ${number} (${p._id}): exists = ${exists}`);
                return { text: `${number} ${exists ? "✅" : ""}`, callback_data: `product_${p._id.toString()}`};
            });
            inline_keyboard.push(row);
        }

        inline_keyboard.push([{text: backButtonText, callback_data: "back"}, {text: goToCartText, callback_data: "cart"}]);
        const messageText = headerText + listOfProductsText.join("\n");
        if (ctx.ctxType === MESSAGE) {
            await ctx.reply(messageText, { reply_markup: { inline_keyboard } });
        } else {
            await ctx.edit(messageText, { reply_markup: { inline_keyboard } });
        }
    },
    async unknownCommandAlert(ctx){
        const text = await localizedString(ctx, "Unknown command!");
        await ctx.answer({
            text,
            show_alert: true
        });
    },
    async unknownCommandText(ctx){
        const text = await localizedString(ctx, "Unknown command!");
        await ctx.reply(text);
    },
    async displayProductDetails(ctx){
        const cartIndex = parseInt(ctx.user.stateDetails);
        const cartItem = ctx.user.cart[cartIndex];
        
        // Populate the product data
        await ctx.user.populate({
            path: `cart.${cartIndex}.product`,
            populate: [
                {path: "title"},
                {path: "description"}
            ]
        });

        const productName = resolveLocalizedText(ctx, cartItem.product?.title) || 'Unnamed product';
        const dbDescription = resolveLocalizedText(ctx, cartItem.product?.description);
        const productDescription = dbDescription || getDefaultDescription(productName);
        
        const addOnsText = cartItem.addOns.length > 0 
            ? `\nDetails: ${cartItem.addOns.map(a => {
                // Remove emoji from kind for display in details
                const cleanKind = a.kind.replace(/👇/g, '');
                return `(${a.forItem+1}| ${cleanKind} ${a.option} ${a.price} UZS)`;
            }).join(", ")}`
            : "\nNo add-ons selected";

        const text = `☕️ Product: ${productName}
💬 Description: ${productDescription}

Currently selected size: ${cartItem.sizeOption.size} - ${cartItem.sizeOption.price} UZS${addOnsText}`;
        
        const detailsText = await localizedString(ctx, "Edit Details");
        const changeSizeText = await localizedString(ctx, "📏 Change Size");
        const backButtonText = await localizedString(ctx, "Next ➡️");
        
        // Create size selection buttons
        const sizeButtons = cartItem.product.sizeOptions.map(sizeOption => ({
            text: `${sizeOption.size} ${cartItem.sizeOption.size === sizeOption.size ? "✅" : ""} - ${sizeOption.price} UZS`,
            callback_data: `size_${sizeOption.size}_${sizeOption.price}`
        }));
        
        let inline_keyboard = [
            [{text: "➖", callback_data: "reduce"}, {text: String(cartItem.quantity), callback_data: "do_not_reply"}, {text: "➕", callback_data: "add"}]
        ];
        
        // Only show "Edit Details" button if product has add-ons
        if (cartItem.product.possibleAddOns && cartItem.product.possibleAddOns.length > 0) {
            inline_keyboard.push([{text: detailsText, callback_data: "edit_details"}]);
        }
        
        // Add size buttons (one per row)
        for (const sizeButton of sizeButtons) {
            inline_keyboard.push([sizeButton]);
        }
        
        inline_keyboard.push([{text: backButtonText, callback_data: "back"}]);
        
        await ctx.edit(text, {
            reply_markup: {
                inline_keyboard
            }
        });
    },
    async displayAvailableProductDetailAddOns(ctx){
        const cartIndex = parseInt(ctx.user.stateDetails);
        const cartItem = ctx.user.cart[cartIndex];
        
        // Populate the product data
        await ctx.user.populate({
            path: `cart.${cartIndex}.product`,
            populate: [
                {path: "title"},
                {path: "description"}
            ]
        });
        
        const product = cartItem.product;
        const currentlySelectedAddOns = cartItem.addOns.filter(a => a.forItem === cartItem.currentItem);

        let inline_keyboard = [];
        if (cartItem.quantity > 1) {
            let items = [];
            for (let i = 0; i < cartItem.quantity; i++) {
                items.push({text: `${i+1} ${cartItem.currentItem === i ? "✅" : ""}`, callback_data: `forItem_${i}`});
            }
            inline_keyboard.push(items);
        }
        // Group possibleAddOns by kind
        const groupedAddOns = product.possibleAddOns.reduce((acc, addOn) => {
            if (!acc[addOn.kind]) acc[addOn.kind] = [];
            acc[addOn.kind].push(addOn);
            return acc;
        }, {});

        // Build keyboard rows
        for (const [kind, addOns] of Object.entries(groupedAddOns)) {
            // First row → the kind name
            inline_keyboard.push([{ text: kind, callback_data: "do_not_reply" }]);

            // Special layout for Syrup👇 - 4 rows × 3 columns
            if (kind === "Syrup👇") {
                const buttonsPerRow = 3;
                for (let i = 0; i < addOns.length; i += buttonsPerRow) {
                    const rowAddOns = addOns.slice(i, i + buttonsPerRow);
                    const optionsRow = rowAddOns.map(addOn => {
                        // ✅ Check if this addOn is already selected
                        const isSelected = currentlySelectedAddOns.some(
                            sel =>
                                sel.kind === addOn.kind &&
                                sel.option === addOn.option
                        );

                        return {
                            text: `${addOn.option}${isSelected ? " ✅" : ""}`,
                            callback_data: `addon_${addOn.kind}_${addOn.option}`
                        };
                    });
                    inline_keyboard.push(optionsRow);
                }
            } else {
                // Default layout for other categories - all options in one row
                const optionsRow = addOns.map(addOn => {
                    // ✅ Check if this addOn is already selected
                    const isSelected = currentlySelectedAddOns.some(
                        sel =>
                            sel.kind === addOn.kind &&
                            sel.option === addOn.option
                    );

                    return {
                        text: `${addOn.option}${isSelected ? " ✅" : ""}`,
                        callback_data: `addon_${addOn.kind}_${addOn.option}`
                    };
                });

                inline_keyboard.push(optionsRow);
            }
        }
        const backButtonText = await localizedString(ctx, "🔙 Back");
        const nextButtonText = await localizedString(ctx, "Next ➡️");
        inline_keyboard.push([
            {text: backButtonText, callback_data: "back"},
            {text: nextButtonText, callback_data: "next"}
        ]);
        // Build a readable list of currently selected add-ons grouped by kind
        const selectedSummary = await (() => {
            if (!currentlySelectedAddOns.length) return localizedString(ctx, "No add\\-ons selected");
            const grouped = currentlySelectedAddOns.reduce((acc, addOn) => {
                // Remove emoji from kind for display in summary
                const cleanKind = addOn.kind.replace(/👇/g, '');
                if (!acc[cleanKind]) acc[cleanKind] = [];
                acc[cleanKind].push(addOn.option);
                return acc;
            }, {});
            return Object.entries(grouped)
                .map(([kind, opts]) => `${kind} ${opts.join(", ")}`)
                .join("\n");
        })();

        // Get localized product name
        const productName = resolveLocalizedText(ctx, product.title) || 'Unnamed product';

        // Final message text
        const text = await localizedString(ctx,
            `🍵 Product: {{productName}}
🛒 Quantity: {{quantity}}
💵 Total price: {{totalPrice}} UZS

Selected add\\-ons:
{{selectedSummary}}`, {
                productName,
                quantity: cartItem.quantity,
                selectedSummary,
                totalPrice: cartItem.totalPrice
            });
        await ctx.edit(text, {reply_markup: {inline_keyboard}});
    },
    async showCartItems(ctx){
        // Populate cart items with product data
        await ctx.user.populate({
            path: "cart.product",
            populate: {path: "title"}
        });
        
        const cartItems = ctx.user.cart;
        const totalPrice = cartItems.reduce(
            (sum, item) => sum + (item.totalPrice || 0),
            0
        );
        
        // Create enumerated list of cart items
        let cartItemsList = "";
        if (cartItems.length > 0) {
            cartItemsList = "\n\n" + cartItems.map((cartItem, index) => {
                const productName = resolveLocalizedText(ctx, cartItem.product?.title) || 'Unnamed product';
                const quantity = cartItem.quantity;
                const size = cartItem.sizeOption.size;
                const itemPrice = cartItem.totalPrice;
                // Format price with thousand separators
                const formattedPrice = itemPrice.toLocaleString('en-US');
                // Escape special characters for MarkdownV2
                const escapedProductName = productName.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
                const escapedSize = size.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
                const escapedPrice = formattedPrice.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
                return `${index + 1}\\. ${escapedProductName} \\(${escapedSize}\\) x${quantity} \\- ${escapedPrice} UZS`;
            }).join("\n");
        }
        
        // Format total price with thousand separators and escape for MarkdownV2
        const formattedTotalPrice = totalPrice.toLocaleString('en-US');
        const escapedTotalPrice = formattedTotalPrice.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
        
        const text = await localizedString(ctx, `💵 *Total price: ${escapedTotalPrice} UZS*

🛒 Your cart items:{{cartItemsList}}`, {
            cartItemsList
        });
        
        const backButtonText = await localizedString(ctx, "🔙 Back");
        const selectPickupTimeText = await localizedString(ctx, "🕔 Select Time ➡️");
        const removeAllText = await localizedString(ctx, "🗑️ Remove all items");

        let inline_keyboard = [];

        // Add remove buttons for each item
        if (cartItems.length > 0) {
            // Group remove buttons in rows of 3
            const removeButtons = [];
            for (let i = 0; i < cartItems.length; i++) {
                removeButtons.push({
                    text: `❌ Remove ${i + 1}`,
                    callback_data: `remove_${i}`
                });
            }
            
            // Add remove buttons in rows of 3
            for (let i = 0; i < removeButtons.length; i += 3) {
                inline_keyboard.push(removeButtons.slice(i, i + 3));
            }
            
            // Add remove all button
            inline_keyboard.push([{text: removeAllText, callback_data: "remove_all"}]);
            
            // Add navigation buttons
            inline_keyboard.push([
                {text: backButtonText, callback_data: "back"}, 
                {text: selectPickupTimeText, callback_data: "select_pickup_time"}
            ]);
        } else {
            inline_keyboard.push([{text: backButtonText, callback_data: "back"}]);
        }

        await ctx.edit(text, {
            reply_markup: {inline_keyboard},
            parse_mode: 'MarkdownV2'
        });
    },
    async showPickupTimes(ctx) {
        let inline_keyboard = [];
        const now = dayjs(); // current time
        const totalOptions = 10;
        const startOffset = 15; // first pickup in +15 minutes

        const times = [];
        for (let i = 0; i < totalOptions; i++) {
            const minutesToAdd = startOffset + i * 5;
            const timeLabel = now.add(minutesToAdd, "minute").format("HH:mm");
            times.push({
                text: timeLabel,
                callback_data: `pickup_${timeLabel}`
            });
        }

        // Group into rows of 2 buttons
        for (let i = 0; i < times.length; i += 2) {
            inline_keyboard.push(times.slice(i, i + 2));
        }

        const backButtonText = await localizedString(ctx, "🔙 Back");
        const refreshButtonText = await localizedString(ctx, "🔄 Refresh Times");

        inline_keyboard.push([
            {text: backButtonText, callback_data: "back"},
            {text: refreshButtonText, callback_data: "refresh_times"}
        ]);

        // Add current time info to the message
        const currentTimeText = await localizedString(ctx, "⏰ Current time: {{currentTime}}", {
            currentTime: now.format("HH:mm")
        });
        const text = await localizedString(ctx, "🔘 Select most applicable pickup-time:\n{{currentTime}}", {
            currentTime: currentTimeText
        });
        await ctx.edit(text, { reply_markup: { inline_keyboard } });
    },
    async payForOrder(ctx){
        // Populate cart items with product data
        await ctx.user.populate({
            path: "cart.product",
            populate: {path: "title"}
        });
        
        const cartItems = ctx.user.cart;
        const totalPrice = cartItems.reduce(
            (sum, item) => sum + (item.totalPrice || 0),
            0
        );
        const pickupTime = ctx.user.stateDetails || 'ASAP';
        const pickupTimeLabel = await localizedString(ctx, "Pickup time:");
        const escapedPickupTimeLabel = pickupTimeLabel.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
        const escapedPickupTime = String(pickupTime).replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
        
        // Create detailed summary of cart items
        let orderSummary = "";
        if (cartItems.length > 0) {
            orderSummary = cartItems.map((cartItem, index) => {
                const productName = resolveLocalizedText(ctx, cartItem.product?.title) || 'Unnamed product';
                const quantity = cartItem.quantity;
                const size = cartItem.sizeOption.size;
                const itemPrice = cartItem.totalPrice;
                const formattedPrice = itemPrice.toLocaleString('en-US');
                // Escape special characters for MarkdownV2
                const escapedProductName = productName.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
                const escapedSize = size.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
                const escapedPrice = formattedPrice.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
                
                // If quantity is 1, show simple format
                if (quantity === 1) {
                    let addonsLines = '';
                    if (Array.isArray(cartItem.addOns) && cartItem.addOns.length) {
                        const addonLines = cartItem.addOns.map(a => {
                            // Remove emoji from kind for order summary display
                            const cleanKind = String(a?.kind || '').replace(/👇/g, '');
                            const kind = cleanKind.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
                            const option = String(a?.option || '').replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
                            return `    · ${kind} ${option}`;
                        }).join("\n");
                        addonsLines = `\n${addonLines}`;
                    }
                    return `• ${escapedProductName} \\(${escapedSize}\\) \\- ${escapedPrice} UZS${addonsLines}`;
                } else {
                    // Multiple quantities - show detailed breakdown
                    const basePrice = cartItem.sizeOption.price || 0;
                    const escapedBasePrice = basePrice.toLocaleString('en-US').replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
                    
                    let itemBreakdown = `• ${escapedProductName} \\(${escapedSize}\\) x${quantity}\n    Base: ${escapedBasePrice} UZS each`;
                    
                    // Group add-ons by item
                    if (Array.isArray(cartItem.addOns) && cartItem.addOns.length) {
                        const groups = {};
                        cartItem.addOns.forEach(a => {
                            const idx = (a?.forItem ?? 0);
                            if (!groups[idx]) groups[idx] = [];
                            groups[idx].push(a);
                        });
                        
                        // Show each individual item with its add-ons
                        for (let i = 0; i < quantity; i++) {
                            itemBreakdown += `\n\n    Item ${i + 1} add\\-ons:`;
                            
                            if (groups[i] && groups[i].length > 0) {
                                groups[i].forEach(a => {
                                    // Remove emoji from kind for order summary display
                                    const cleanKind = String(a?.kind || '').replace(/👇/g, '');
                                    const kind = cleanKind.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
                                    const option = String(a?.option || '').replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
                                    itemBreakdown += `\n      · ${kind} ${option}`;
                                });
                            } else {
                                itemBreakdown += `\n      · No add\\-ons`;
                            }
                            
                            // Calculate item total
                            const itemAddonPrice = groups[i] ? 
                                groups[i].reduce((sum, addon) => sum + (addon.price || 0), 0) : 0;
                            const itemTotal = basePrice + itemAddonPrice;
                            const escapedItemTotal = itemTotal.toLocaleString('en-US').replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
                            
                            itemBreakdown += `\n      Total: ${escapedItemTotal} UZS`;
                        }
                    } else {
                        // No add-ons for any items
                        itemBreakdown += `\n\n    All ${quantity} items: No add\\-ons\n    Each: ${escapedBasePrice} UZS`;
                    }
                    
                    itemBreakdown += `\n    Subtotal: ${escapedPrice} UZS`;
                    return itemBreakdown;
                }
            }).join("\n\n");
        }
        
        // Format total price with thousand separators and escape for MarkdownV2
        const formattedTotalPrice = totalPrice.toLocaleString('en-US');
        const escapedTotalPrice = formattedTotalPrice.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
        
        // Get localized strings for order summary
        const orderSummaryTitle = await localizedString(ctx, "Your Order Summary:");
        const totalAmountText = await localizedString(ctx, "Total Amount:");
        const transferText = await localizedString(ctx, "Transfer money to this bank card:");
        const lastNameText = await localizedString(ctx, "Samad Kaypnazarov");
        const screenshotText = await localizedString(ctx, "⚠️ CRITICAL: Take a screenshot of your payment BEFORE pressing Pay button!");
        const screenshotWarning = await localizedString(ctx, "📱 You MUST show this payment screenshot when picking up your order!");
        
        // Escape special characters for MarkdownV2 in localized strings
        const escapedOrderSummaryTitle = orderSummaryTitle.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
        const escapedTotalAmountText = totalAmountText.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
        const escapedTransferText = transferText.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
        const escapedLastNameText = lastNameText.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
        const escapedScreenshotText = screenshotText.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
        const escapedScreenshotWarning = screenshotWarning.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
        
        const text = `*${escapedOrderSummaryTitle}*

*${escapedPickupTimeLabel}* ${escapedPickupTime}

${orderSummary}

*${escapedTotalAmountText} ${escapedTotalPrice} UZS*

${escapedTransferText}
\`5614 6800 0448 6557\`
${escapedLastNameText}

*${escapedScreenshotText}*

*${escapedScreenshotWarning}*`;
        
        const backButtonText = await localizedString(ctx, "🔙 Back");
        const payButtonText = await localizedString(ctx, "💵 Have Paid");
        await ctx.edit(text, {
            reply_markup: {
                inline_keyboard: [
                    [{text: payButtonText, callback_data: "pay"}],
                    [{text: backButtonText, callback_data: "back"}]
                ]
            },
            parse_mode: 'MarkdownV2'
        });
    },
    async waitForOrder(ctx){
        // Build a detailed order confirmation after user pressed Pay
        let header = await localizedString(ctx, `✅ Payment received!`);
        let subtitle = await localizedString(ctx, `Here are your order details:`);
        let orderIdLabel = await localizedString(ctx, `Order ID:`);
        let pickupTimeLabel = await localizedString(ctx, `Pickup time:`);
        let itemsLabel = await localizedString(ctx, `Items:`);
        let totalAmountText = await localizedString(ctx, "Total Amount:");
        let receiptInfo = await localizedString(ctx, "📄 Receipt Information:");
        let receiptNote = await localizedString(ctx, "⚠️ IMPORTANT: You MUST show BOTH this order information and <b>payment screenshot</b> to Samad aka when picking up your order.");
        let paymentScreenshotWarning = await localizedString(ctx, "📱 PAYMENT SCREENSHOT REQUIRED:");
        let paymentScreenshotNote = await localizedString(ctx, "You must show the screenshot of your payment transfer to receive your order. Without it, we cannot confirm your payment.");
        let pickupInstructions = await localizedString(ctx, "📍 Pickup Instructions:");
        let pickupLocation = await localizedString(ctx, "Come to Samad aka's Coffee Shop at your selected time. Greet and show your payment screenshot to take your order. Thank you!");
        let contactInfo = await localizedString(ctx, "📞 Need help? Contact us for any questions.");
        const doneText = await localizedString(ctx, `✅ I've picked up my order`);

        let orderSummary = "";
        let escapedTotalPrice = "0";
        let orderId = "";
        let pickupTime = "ASAP";
        
        try {
            orderId = ctx.user.stateDetails; // Now contains short order number like "DR-20250130-001"
            const order = await Order.findOne({ orderNumber: orderId })
                .populate({
                    path: 'selectedProducts.product',
                    populate: { path: 'title' },
                    select: 'title'
                })
                .exec();

            let cartItems = order?.selectedProducts || [];
            pickupTime = order?.pickupTime || 'ASAP';
            const totalPrice = cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            const formattedTotalPrice = totalPrice.toLocaleString('en-US');
            escapedTotalPrice = formattedTotalPrice.replace(/[_*\[\]()~`>#\+=|{}.!-]/g, '\\$&');

            // If order contains no items for some reason, fallback to the user's current cart
            if (!cartItems.length) {
                await ctx.user.populate({ path: 'cart.product', populate: { path: 'title' } });
                cartItems = ctx.user.cart || [];
                pickupTime = ctx.user.stateDetails || 'ASAP';
            }

            if (cartItems.length > 0) {
                orderSummary = cartItems.map((cartItem) => {
                    const productName = resolveLocalizedText(ctx, cartItem.product?.title) || 'Unnamed product';
                    const quantity = cartItem.quantity || 1;
                    const size = cartItem.sizeOption?.size || '';
                    const itemPrice = cartItem.totalPrice || 0;
                    const formattedPrice = itemPrice.toLocaleString('en-US');

                    // If quantity is 1, show simple format
                    if (quantity === 1) {
                        let addonsLines = '';
                        if (Array.isArray(cartItem.addOns) && cartItem.addOns.length) {
                            const addonLines = cartItem.addOns.map(a => {
                                // Remove emoji from kind for order confirmation display
                                const cleanKind = String(a?.kind || '').replace(/👇/g, '');
                                const kind = cleanKind;
                                const option = String(a?.option || '');
                                return `    · ${kind} ${option}`;
                            }).join("\n");
                            addonsLines = `\n${addonLines}`;
                        }
                        return `• ${productName} (${size}) - ${formattedPrice} UZS${addonsLines}`;
                    } else {
                        // Multiple quantities - show detailed breakdown
                        const basePrice = cartItem.sizeOption?.price || 0;
                        const formattedBasePrice = basePrice.toLocaleString('en-US');
                        
                        let itemBreakdown = `• ${productName} (${size}) x${quantity}\n    Base: ${formattedBasePrice} UZS each`;
                        
                        // Group add-ons by item
                        if (Array.isArray(cartItem.addOns) && cartItem.addOns.length) {
                            const groups = {};
                            cartItem.addOns.forEach(a => {
                                const idx = (a?.forItem ?? 0);
                                if (!groups[idx]) groups[idx] = [];
                                groups[idx].push(a);
                            });
                            
                            // Show each individual item with its add-ons
                            for (let i = 0; i < quantity; i++) {
                                itemBreakdown += `\n\n    Item ${i + 1} add\\-ons:`;
                                
                                if (groups[i] && groups[i].length > 0) {
                                    groups[i].forEach(a => {
                                        // Remove emoji from kind for order confirmation display
                                        const cleanKind = String(a?.kind || '').replace(/👇/g, '');
                                        const kind = cleanKind;
                                        const option = String(a?.option || '');
                                        itemBreakdown += `\n      · ${kind} ${option}`;
                                    });
                            } else {
                                itemBreakdown += `\n      · No add\\-ons`;
                            }
                                
                                // Calculate item total
                                const itemAddonPrice = groups[i] ? 
                                    groups[i].reduce((sum, addon) => sum + (addon.price || 0), 0) : 0;
                                const itemTotal = basePrice + itemAddonPrice;
                                const formattedItemTotal = itemTotal.toLocaleString('en-US');
                                
                                itemBreakdown += `\n      Total: ${formattedItemTotal} UZS`;
                            }
                        } else {
                            // No add-ons for any items
                            itemBreakdown += `\n\n    All ${quantity} items: No add\\-ons\n    Each: ${formattedBasePrice} UZS`;
                        }
                        
                        itemBreakdown += `\n    Subtotal: ${formattedPrice} UZS`;
                        return itemBreakdown;
                    }
                }).join("\n\n");
            }

            // Use HTML formatting instead of MarkdownV2 to avoid escaping issues
            const text = `<i>${subtitle}</i>

<b>${orderIdLabel}</b> ${orderId}
<b>${pickupTimeLabel}</b> ${pickupTime}

<b>${itemsLabel}</b>
${orderSummary}

<b>${totalAmountText} ${formattedTotalPrice} UZS</b>

─────────────────────────

<b>${receiptInfo}</b>
${receiptNote}

<b>${paymentScreenshotWarning}</b>
${paymentScreenshotNote}

<b>${pickupInstructions}</b>
${pickupLocation}`;

            await ctx.edit(text, {
                reply_markup: {
                    inline_keyboard: [
                        [{text: doneText, callback_data: "done"}]
                    ]
                },
                parse_mode: 'HTML'
            });
        } catch (e) {
            console.error('Error in waitForOrder:', e);
            const fallback = await localizedString(ctx, `Your order is being prepared. Press [Done] when you pick it up.`);
            await ctx.edit(fallback, {
                reply_markup: {
                    inline_keyboard: [
                        [{text: doneText, callback_data: "done"}]
                    ]
                }
            });
        }
    }
}

export default fns;
