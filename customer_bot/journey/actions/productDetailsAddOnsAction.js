import fns from "../fns.js";
import Product from "../../../schemas/product.js";
import saveWithRetry from "../../../utils/saveWithRetry.js";
import Customer from "../../../schemas/customer.js";
import { validateCartIndex, validateUserContext } from "../../../utils/inputValidation.js";

export default async function(ctx, _this){
    if (!(await _this._validation(ctx))) return console.error(`Validation failed in {...status: "${_this.state}"}`);
    if (ctx.data === "back") {
        ctx.user.state = "product-details";
        await saveWithRetry(ctx.user);
        await fns.displayProductDetails(ctx);
    }
    if (ctx.data === "do_not_reply") await ctx.answer();
    if (ctx.data.startsWith("forItem_")) { // User state does not change here...
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
        
        const currentCartItem = ctx.user.cart[cartIndex];
        currentCartItem.currentItem = Number(ctx.data.split("_")[1]);
        await saveWithRetry(ctx.user);
        await fns.displayAvailableProductDetailAddOns(ctx);
    }
    if (ctx.data.startsWith("addon_")) {
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
        
        const [_, kind, option] = ctx.data.split("_");
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
        
        const currentCartItem = ctx.user.cart[cartIndex];

        // Determine the item index we're editing
        const forItem = currentCartItem.currentItem;

        // Check if the clicked addon is already selected
        const existingAddon = currentCartItem.addOns.find(
            a => a.forItem === forItem && a.kind === kind && a.option === option
        );

        if (existingAddon) {
            // If clicking on already selected addon, remove it (toggle off)
            currentCartItem.addOns = currentCartItem.addOns.filter(
                a => !(a.forItem === forItem && a.kind === kind && a.option === option)
            );
        } else {
            // Remove any previous addOn of the same kind for this item
            currentCartItem.addOns = currentCartItem.addOns.filter(
                a => !(a.forItem === forItem && a.kind === kind)
            );

            // Find the selected addOns price from the product definition
            const product = await Product.findById(currentCartItem.product).exec();
            const selectedAddOn = product.possibleAddOns.find(a => a.kind === kind && a.option === option);

            // Add the new selection
            currentCartItem.addOns.push({
                forItem,
                kind,
                option,
                price: selectedAddOn ? selectedAddOn.price : 0
            });
        }

        // (Optional) Recalculate total price
        const addOnsTotal = currentCartItem.addOns.reduce((sum, a) => sum + a.price, 0);
        currentCartItem.totalPrice = (currentCartItem.sizeOption.price * currentCartItem.quantity) + addOnsTotal;

        // Save with retry logic for version conflicts
        try {
            await saveWithRetry(ctx.user);
        } catch (error) {
            if (error.name === 'VersionError') {
                console.log('Version conflict detected, refetching user data...');
                // Refetch the user and retry the operation
                const freshUser = await Customer.findById(ctx.user._id);
                if (freshUser) {
                    ctx.user = freshUser;
                }
                const refreshedCartItem = ctx.user.cart[cartIndex];
                
                // Reapply the changes
                refreshedCartItem.addOns = refreshedCartItem.addOns.filter(
                    a => !(a.forItem === forItem && a.kind === kind)
                );
                refreshedCartItem.addOns.push({
                    forItem,
                    kind,
                    option,
                    price: selectedAddOn ? selectedAddOn.price : 0
                });
                
                const newAddOnsTotal = refreshedCartItem.addOns.reduce((sum, a) => sum + a.price, 0);
                refreshedCartItem.totalPrice = (refreshedCartItem.sizeOption.price * refreshedCartItem.quantity) + newAddOnsTotal;
                
                await saveWithRetry(ctx.user);
            } else {
                throw error; // Re-throw if it's not a version error
            }
        }

        // Refresh the UI
        await fns.displayAvailableProductDetailAddOns(ctx);
    }
    if (ctx.data === "next") {
        ctx.user.state = "explore-products";
        ctx.user.stateDetails = "none";
        await saveWithRetry(ctx.user);
        await fns.showProductsMenu(ctx);
    }
}