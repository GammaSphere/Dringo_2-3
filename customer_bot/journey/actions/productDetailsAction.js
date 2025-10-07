import fns from "../fns.js";
import Product from "../../../schemas/product.js";
import Customer from "../../../schemas/customer.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";
import { validateCartIndex, validateUserContext } from "../../../utils/inputValidation.js";

export default async function(ctx, _this){
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in {...status: "${_this.state}"}`);
    if (ctx.data === "back") {
        ctx.user.state = "explore-products";
        ctx.user.stateDetails = "none";
        await saveWithRetry(ctx.user);
        await fns.showProductsMenu(ctx);
    }
    if (ctx.data === "do_not_reply") await ctx.answer();
    if (ctx.data === "reduce") {
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
        
        const cartIndex = parseInt(ctx.user.stateDetails);

        // Validate cart index
        if (!validateCartIndex(cartIndex, ctx.user.cart.length)) {
            console.log('Invalid cart index, resetting state');
            ctx.user.state = "explore-products";
            ctx.user.stateDetails = "none";
            await saveWithRetry(ctx.user);
            await fns.showProductsMenu(ctx);
            return;
        }

        // Validate cart item exists
        if (!ctx.user.cart[cartIndex]) {
            console.log('Cart item not found, resetting state');
            ctx.user.state = "explore-products";
            ctx.user.stateDetails = "none";
            await saveWithRetry(ctx.user);
            await fns.showProductsMenu(ctx);
            return;
        }
        
        const cartItem = ctx.user.cart[cartIndex];
        
        if (cartItem.quantity > 1) {
            cartItem.quantity -= 1;
            // Remove addons for the last item
            cartItem.addOns = cartItem.addOns.filter(a => a.forItem !== cartItem.quantity);
            // Recalculate total price
            const addOnsTotal = cartItem.addOns.reduce((sum, a) => sum + (a.price || 0), 0);
            cartItem.totalPrice = (cartItem.sizeOption.price * cartItem.quantity) + addOnsTotal;
            
            // Save with retry logic for version conflicts
            await saveWithRetry(ctx.user);
        } else {
            // Remove item from cart
            console.log(`Removing item from cart. Cart length before: ${ctx.user.cart.length}`);
            console.log(`Removing item at index: ${cartIndex}`);
            ctx.user.cart.splice(cartIndex, 1);
            console.log(`Cart length after removal: ${ctx.user.cart.length}`);
            
            ctx.user.state = "explore-products";
            ctx.user.stateDetails = "none";
            await saveWithRetry(ctx.user);
            console.log(`User saved. Final cart length: ${ctx.user.cart.length}`);
            
            await fns.showProductsMenu(ctx);
            return;
        }
        await fns.displayProductDetails(ctx);
    }
    if (ctx.data === "add") {
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
        
        const cartIndex = parseInt(ctx.user.stateDetails);

        // Validate cart index
        if (!validateCartIndex(cartIndex, ctx.user.cart.length)) {
            console.log('Invalid cart index, resetting state');
            ctx.user.state = "explore-products";
            ctx.user.stateDetails = "none";
            await saveWithRetry(ctx.user);
            await fns.showProductsMenu(ctx);
            return;
        }

        // Validate cart item exists
        if (!ctx.user.cart[cartIndex]) {
            console.log('Cart item not found, resetting state');
            ctx.user.state = "explore-products";
            ctx.user.stateDetails = "none";
            await saveWithRetry(ctx.user);
            await fns.showProductsMenu(ctx);
            return;
        }
        
        const cartItem = ctx.user.cart[cartIndex];
        
        if (cartItem.quantity < 4) {
            const product = await Product.findById(cartItem.product).exec();
            cartItem.quantity += 1;
            
            // Add default addons for the new item
            const newItemIndex = cartItem.quantity - 1;
            const defaultAddOnsForNewItem = product.defaultAddOns.map(dao => ({
                forItem: newItemIndex,
                kind: dao.kind,
                option: dao.option,
                price: dao.price || 0
            }));
            cartItem.addOns.push(...defaultAddOnsForNewItem);
            
            // Recalculate total price
            const addOnsTotal = cartItem.addOns.reduce((sum, a) => sum + (a.price || 0), 0);
            cartItem.totalPrice = (cartItem.sizeOption.price * cartItem.quantity) + addOnsTotal;
            
            // Save with retry logic for version conflicts
            await saveWithRetry(ctx.user);
        } else {
                const { default: localizedString } = await import("../../../utils/localizedString.js");
                const errorText = await localizedString(ctx, "You cannot add more than 4 items of the same product");
                await ctx.answer({
                    text: errorText,
                    show_alert: true
                });
        }
        await fns.displayProductDetails(ctx);
    }
    if (ctx.data === "edit_details") {
        ctx.user.state = "product-details-addons";
        await saveWithRetry(ctx.user);
        await fns.displayAvailableProductDetailAddOns(ctx);
    }
    if (ctx.data.startsWith("size_")) {
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
        
        const [_, size, price] = ctx.data.split("_");
        const cartIndex = parseInt(ctx.user.stateDetails);

        // Validate cart index
        if (!validateCartIndex(cartIndex, ctx.user.cart.length)) {
            console.log('Invalid cart index, resetting state');
            ctx.user.state = "explore-products";
            ctx.user.stateDetails = "none";
            await saveWithRetry(ctx.user);
            await fns.showProductsMenu(ctx);
            return;
        }

        // Validate cart item exists
        if (!ctx.user.cart[cartIndex]) {
            console.log('Cart item not found, resetting state');
            ctx.user.state = "explore-products";
            ctx.user.stateDetails = "none";
            await saveWithRetry(ctx.user);
            await fns.showProductsMenu(ctx);
            return;
        }
        
        const cartItem = ctx.user.cart[cartIndex];
        
        // Update the size option
        cartItem.sizeOption = {
            size: size,
            price: Number(price)
        };
        
        // Recalculate total price with new size
        const addOnsTotal = cartItem.addOns.reduce((sum, a) => sum + (a.price || 0), 0);
        cartItem.totalPrice = (Number(price) * cartItem.quantity) + addOnsTotal;
        
        // Save with retry logic for version conflicts
        await saveWithRetry(ctx.user);
        await fns.displayProductDetails(ctx);
    }
}