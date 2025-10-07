import mongoose, {Schema} from "mongoose";

const orderSchema = new Schema({
    orderNumber: {type: String, required: true, unique: true, index: true}, // Short readable order ID
    customer: {type: Schema.Types.ObjectId, required: true, ref: "Customer"},
    selectedProducts: [{
        product: {type: Schema.Types.ObjectId, ref: "Product", required: true},
        quantity: {type: Number, required: true, default: 1},
        sizeOption: {
            size: {type: String, required: true},
            price: {type: Number, required: true}
        },
        addOns: [{
            forItem: {type: Number, required: true, default: 0},
            kind: {type: String, required: true},
            option: {type: String, required: true},
            price: {type: Number, required: true, default: 0}
        }],
        totalPrice: {type: Number, required: true, default: 0}
    }],
    pickupTime: {type: String},
    status: {type: String, required: true, default: "waiting-for-receipt"}, // waiting-for-receipt | ready
}, {
    timestamps: true
});

export default mongoose.model("Order", orderSchema);