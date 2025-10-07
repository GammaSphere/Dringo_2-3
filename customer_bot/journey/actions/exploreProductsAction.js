import fns from "../fns.js";
import Product from "../../../schemas/product.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";
import { validateCallbackData, validateProductId, validateUserContext } from "../../../utils/inputValidation.js";
import { checkProductAvailability, validateProductData } from "../../../utils/productValidation.js";

export default async function(ctx, _this){
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in {...status: "${_this.state}"}`);
    if (ctx.data === "back") {
        ctx.user.state = "none";
        ctx.user.stateDetails = "none";
        await saveWithRetry(ctx.user);
        await fns.displayMain(ctx);
    }
    if (ctx.data.startsWith("product_")) {
        // Validate callback data
        if (!validateCallbackData(ctx.data, "product_")) {
                const { default: localizedString } = await import("../../../utils/localizedString.js");
                const errorText = await localizedString(ctx, "⚠️ Invalid product selection. Please try again.");
                await ctx.answer({
                    text: errorText,
                    show_alert: true
                });
            return;
        }
        
        const productId = ctx.data.split("_")[1];
        
        // Validate product ID
        if (!validateProductId(productId)) {
                const { default: localizedString } = await import("../../../utils/localizedString.js");
                const errorText = await localizedString(ctx, "⚠️ Invalid product ID. Please try again.");
                await ctx.answer({
                    text: errorText,
                    show_alert: true
                });
            return;
        }
        
        // Validate user context
        const contextValidation = validateUserContext(ctx);
        if (!contextValidation.isValid) {
            console.error('User context validation failed:', contextValidation.errors);
                const { default: localizedString } = await import("../../../utils/localizedString.js");
                const errorText = await localizedString(ctx, "⚠️ Session error. Please restart with /start");
                await ctx.answer({
                    text: errorText,
                    show_alert: true
                });
            return;
        }
        
        // Check product availability with comprehensive validation
        const availability = await checkProductAvailability(productId);
        
        if (!availability.exists) {
                const { default: localizedString } = await import("../../../utils/localizedString.js");
                const errorText = await localizedString(ctx, "⚠️ Product not found. Please select another product.");
                await ctx.answer({
                    text: errorText,
                    show_alert: true
                });
            return;
        }
        
        if (!availability.isActive) {
            const { default: localizedString } = await import("../../../utils/localizedString.js");
            const errorText = await localizedString(ctx, "⚠️ This product is currently unavailable. Please select another product.");
            await ctx.answer({
                text: errorText,
                show_alert: true
            });
            return;
        }
        
        // Validate product data integrity
        const productValidation = validateProductData(availability.product);
        if (!productValidation.isValid) {
            console.error('Product data validation failed:', productValidation.errors);
                const { default: localizedString } = await import("../../../utils/localizedString.js");
                const errorText = await localizedString(ctx, "⚠️ Product data error. Please select another product.");
                await ctx.answer({
                    text: errorText,
                    show_alert: true
                });
            return;
        }
        
        const product = availability.product;
        const sizeOption = product.sizeOptions[product.sizeOptions.length - 1];
        const totalPriceOfAddOns = product.defaultAddOns.reduce(
            (sum, addOn) => sum + (addOn.price || 0),
            0
        );
        
        // Check if product already exists in cart
        console.log(`Looking for product ${productId} with size ${sizeOption.size} in cart`);
        console.log(`Current cart items: ${ctx.user.cart.length}`);
        
        const existingCartItemIndex = ctx.user.cart.findIndex(item => 
            item.product.toString() === productId && 
            item.sizeOption.size === sizeOption.size
        );
        
        console.log(`Existing cart item index: ${existingCartItemIndex}`);
        
        if (existingCartItemIndex !== -1) {
            // Product exists, increase quantity
            const existingItem = ctx.user.cart[existingCartItemIndex];
            existingItem.quantity += 1;
            
            // Add default addons for the new quantity item
            const newItemIndex = existingItem.quantity - 1;
            const defaultAddOnsForNewItem = product.defaultAddOns.map(dao => ({
                forItem: newItemIndex,
                kind: dao.kind,
                option: dao.option,
                price: dao.price || 0
            }));
            existingItem.addOns.push(...defaultAddOnsForNewItem);
            
            // Recalculate total price
            const addOnsTotal = existingItem.addOns.reduce((sum, a) => sum + (a.price || 0), 0);
            existingItem.totalPrice = (existingItem.sizeOption.price * existingItem.quantity) + addOnsTotal;
            
            ctx.user.state = "product-details";
            ctx.user.stateDetails = existingCartItemIndex.toString();
        } else {
            // Check cart limit before adding new product
            if (ctx.user.cart.length >= 5) {
                const { default: localizedString } = await import("../../../utils/localizedString.js");
                const errorText = await localizedString(ctx, "⚠️ Maximum 5 products allowed in cart. Please remove some items or complete your current order.");
                await ctx.answer({
                    text: errorText,
                    show_alert: true
                });
                return;
            }
            
            // Product doesn't exist, create new cart item
            const newCartItem = {
                product: product._id,
                quantity: 1,
                sizeOption: sizeOption,
                addOns: product.defaultAddOns.map(dao => ({
                    forItem: 0,
                    kind: dao.kind,
                    option: dao.option,
                    price: dao.price || 0
                })),
                currentItem: 0,
                totalPrice: sizeOption.price + totalPriceOfAddOns
            };
            
            ctx.user.cart.push(newCartItem);
            ctx.user.state = "product-details";
            ctx.user.stateDetails = (ctx.user.cart.length - 1).toString();
        }
        
        await saveWithRetry(ctx.user);
        await fns.displayProductDetails(ctx);
    }
    if (ctx.data === "cart") {
        ctx.user.state = "review-cart";
        await saveWithRetry(ctx.user);
        await fns.showCartItems(ctx);
    }
}