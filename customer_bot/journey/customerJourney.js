import freshStartValidation from "./validators/freshStartValidation.js";
import freshStartAction from "./actions/freshStartAction.js";
import acceptTermsValidation from "./validators/acceptTermsValidation.js";
import acceptTermsAction from "./actions/acceptTermsAction.js";
import chooseLanguageValidation from "./validators/chooseLanguageValidation.js";
import chooseLanguageAction from "./actions/chooseLanguageAction.js";
import givePhoneNumberValidation from "./validators/givePhoneNumberValidation.js";
import givePhoneNumberAction from "./actions/givePhoneNumberAction.js";
import giveFullNameValidation from "./validators/giveFullNameValidation.js";
import giveFullNameAction from "./actions/giveFullNameAction.js";
import noneValidation from "./validators/noneValidation.js";
import noneAction from "./actions/noneAction.js";
import supportValidation from "./validators/supportValidation.js";
import supportAction from "./actions/supportAction.js";
import settingsValidation from "./validators/settingsValidation.js";
import settingsAction from "./actions/settingsAction.js";
import changeLanguageValidation from "./validators/changeLanguageValidation.js";
import changeLanguageAction from "./actions/changeLanguageAction.js";
import exploreProductsValidation from "./validators/exploreProductsValidation.js";
import exploreProductsAction from "./actions/exploreProductsAction.js";
import saveWithRetry from "../../utils/saveWithRetry.js";
import productDetailsValidation from "./validators/productDetailsValidation.js";
import productDetailsAction from "./actions/productDetailsAction.js";
import productDetailsAddOnsValidation from "./validators/productDetailsAddOnsValidation.js";
import productDetailsAddOnsAction from "./actions/productDetailsAddOnsAction.js";
import reviewCartValidation from "./validators/reviewCartValidation.js";
import reviewCartAction from "./actions/reviewCartAction.js";
import selectPickupTimeValidation from "./validators/selectPickupTimeValidation.js";
import selectPickupTimeAction from "./actions/selectPickupTimeAction.js";
import payingForOrderValidation from "./validators/payingForOrderValidation.js";
import payingForOrderAction from "./actions/payingForOrderAction.js";
import waitingForOrderValidation from "./validators/waitingForOrderValidation.js";
import waitingForOrderAction from "./actions/waitingForOrderAction.js";
import pickupConfirmedValidation from "./validators/pickupConfirmedValidation.js";
import pickupConfirmedAction from "./actions/pickupConfirmedAction.js";

const journeyPath = [
    /**
     * When customer just joined the chatbot
     */
    {
        state: "fresh-start",
        navItem: null,
        back: false,
        _validation(ctx) { return freshStartValidation(ctx, this); },
        action(ctx){ return freshStartAction(ctx, this) },
        async _updateCustomerData(ctx) {
            ctx.user.state = "accepting-terms";
            await saveWithRetry(ctx.user);
        }
    },
    /**
     * When customer was prompted to accept terms:
     * Customer has only one way of accepting those terms -> Tapping "I Agree" button
     */
    {
        state: "accepting-terms",
        navItem: null,
        back: false,
        _validation(ctx) { return acceptTermsValidation(ctx, this); },
        action(ctx){ return acceptTermsAction(ctx, this); },
        async _updateCustomerData(ctx){
            ctx.user.state = "choosing-language";
            await saveWithRetry(ctx.user);
        }
    },
    /**
     * When user is prompted to choose a language
     */
    {
        state: "choosing-language",
        navItem: null,
        back: false,
        _validation(ctx) { return chooseLanguageValidation(ctx, this); },
        action(ctx){ return chooseLanguageAction(ctx, this); },
        async _updateCustomerData(ctx){
            ctx.user.state = "giving-phone-number";
            await saveWithRetry(ctx.user);
        }
    },
    /**
     * When user is prompted to share contact info
     */
    {
        state: "giving-phone-number",
        navItem: null,
        back: false,
        _validation(ctx) { return givePhoneNumberValidation(ctx, this); },
        action(ctx){ return givePhoneNumberAction(ctx, this); },
        async _updateCustomerData(ctx){
            ctx.user.state = "giving-full-name";
            await saveWithRetry(ctx.user);
        }
    },
    /**
     * When user is prompted to write his full name
     */
    {
        state: "giving-full-name",
        navItem: null,
        back: false,
        _validation(ctx) { return giveFullNameValidation(ctx, this) },
        action(ctx){ return giveFullNameAction(ctx, this); },
        async _updateCustomerData(ctx){
            ctx.user.state = "none";
            await saveWithRetry(ctx.user);
        }
    },
    /**
     * When user is not under any state... | Usually Main screen is going to be displayed
     */
    {
        state: "none",
        navItem: null,
        back: false,
        _validation(ctx) { return noneValidation(ctx, this); },
        action(ctx){ return noneAction(ctx, this); }
    },
    /**
     * When user opens "Support" from Main screen
     */
    {
        state: "support",
        navItem: "support",
        back: true,
        _validation(ctx){ return supportValidation(ctx, this); },
        action(ctx){ return supportAction(ctx, this); },
        async _updateCustomerData(ctx){
            ctx.user.state = "none";
            await saveWithRetry(ctx.user);
        }
    },
    /**
     * When user opened "Settings" from Main screen
     */
    {
        state: "settings",
        navItem: "settings",
        back: true,
        _validation(ctx){ return settingsValidation(ctx, this); },
        action(ctx){ return settingsAction(ctx, this); },
        async _updateCustomerData(ctx){
            ctx.user.state = "none";
            await saveWithRetry(ctx.user);
        }
    },
    /**
     * When user is trying to change language
     */
    {
        state: "changing-language",
        navItem: "language",
        back: true,
        _validation(ctx){ return changeLanguageValidation(ctx, this); },
        action(ctx){ return changeLanguageAction(ctx, this); }
    },
    /**
     * When user opens "Explore Products" from Main Screen
     */
    {
        state: "explore-products",
        navItem: "products",
        back: true,
        _validation(ctx) { return exploreProductsValidation(ctx, this); },
        action(ctx) { return exploreProductsAction(ctx, this); }
    },
    /**
     * When user selects a product
     */
    {
        state: "product-details",
        navItem: "details",
        back: true,
        _validation(ctx) { return productDetailsValidation(ctx, this); },
        action(ctx) { return productDetailsAction(ctx, this); }
    },
    /**
     * When user selects "Edit Details"
     */
    {
        state: "product-details-addons",
        navItem: "addons",
        back: true,
        _validation(ctx) { return productDetailsAddOnsValidation(ctx, this); },
        action(ctx) { return productDetailsAddOnsAction(ctx, this); }
    },
    /**
     * When user goes to cart
     */
    {
        state: "review-cart",
        navItem: "cart",
        back: true,
        _validation(ctx) { return reviewCartValidation(ctx, this); },
        action(ctx) { return reviewCartAction(ctx, this); }
    },
    /**
     * When user goes to select pickup time
     */
    {
        state: "select-pickup-time",
        navItem: "pickup",
        back: true,
        _validation(ctx) { return selectPickupTimeValidation(ctx, this); },
        action(ctx) { return selectPickupTimeAction(ctx, this); }
    },
    /**
     * When user selects a suitable time and is prompted to pay
     */
    {
        state: "paying-for-order",
        navItem: "pay",
        back: true,
        _validation(ctx) { return payingForOrderValidation(ctx, this); },
        action(ctx) { return payingForOrderAction(ctx, this); }
    },
    /**
     * When user paid
     */
    {
        state: "waiting-for-order",
        navItem: "waiting",
        back: true,
        _validation(ctx) { return waitingForOrderValidation(ctx, this); },
        action(ctx) { return waitingForOrderAction(ctx, this); }
    },
    /**
     * When user confirms pickup from notification
     */
    {
        state: "pickup-confirmed",
        navItem: null,
        back: false,
        _validation(ctx) { return pickupConfirmedValidation(ctx, this); },
        action(ctx) { return pickupConfirmedAction(ctx, this); }
    }
];

export default journeyPath;