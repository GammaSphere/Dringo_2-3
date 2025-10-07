import mongoose, {Schema} from "mongoose";

const customerSchema = new Schema({
    telegramId: {type: Number, required: true, unique: true, index: true},
    agreedToTerms: {type: Boolean, required: true, default: false},
    preferredLanguage: {type: String},
    phoneNumber: {type: String},
    fullName: {type: String},
    lastSavedLocation: {
        latitude: {type: Number},
        longitude: {type: Number}
    },
    cart: [{
        product: {type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true},
        quantity: {type: Number, required: true, default: 1},
        sizeOption: {
            size: {type: String, required: true},
            price: {type: Number, required: true}
        },
        addOns: [{
            forItem: {type: Number, required: true, default: 0}, // Which item in the quantity this addon is for
            kind: {type: String, required: true}, // Sugar | Syrup | Cream
            option: {type: String, required: true}, // 0 spoons | 1 spoon | 2 spoons | vanilla | caramel | etc.
            price: {type: Number, required: true, default: 0}
        }],
        currentItem: {type: Number, default: 0}, // For editing specific item in quantity
        totalPrice: {type: Number, required: true, default: 0}
    }],
    lastSeenMessageId: {type: Number},
    lastActionTime: {type: Number, default: 0}, // For button debouncing
    state: {
        type: String,
        required: true,
        enum: [
            "fresh-start",
            "accepting-terms", "choosing-language", "giving-phone-number", "giving-full-name", // Registration process
            "none", // When in Main section
            "support", // When reaching out for support
            "settings", "changing-language", // When opened settings
            "explore-products", // When selected "Menu" from Info stateDetails === cafe._id | need to show MENU of cafe
            "product-details", // When selected a product from MENU stateDetails === cartItem._id | need to show Product Details
            "product-details-addons", // When has 2 or more of the product and customizes addons stateDetails === cartItem._id | need to show AddOn Details
            "review-cart", // When user opens cart or presses "Done" button | all cart items are shown in this section
            "select-pickup-time", // When user presses "Continue" button after reviewing the cart | user will be prompted to select pickup time
            "paying-for-order", // When users select appropriate time, they will be prompted to pay for the order
            "waiting-for-order", // When user pays successfully stateDetails === order.id | There will be some kind of message like (We will notify you, when it is ready, please be there on time)
            "banned" // When user is banned from the system, stateDetails === Reason why the user was banished

        ],
        default: "fresh-start"
    },
    stateDetails: {
        type: String,
        required: true,
        default: "none"
    }
}, {
    timestamps: true
});

export default mongoose.model("Customer", customerSchema);
