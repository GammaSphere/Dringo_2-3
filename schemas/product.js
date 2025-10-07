import mongoose, {Schema} from "mongoose";

const productSchema = new Schema({
    title: {type: Schema.Types.ObjectId, ref: "Localization"},
    description: {type: Schema.Types.ObjectId, ref: "Localization"},
    sizeOptions: [{
        size: {type: String, required: true}, // Small, Medium, Large
        price: {type: Number, required: true}
    }],
    defaultAddOns: [{
        kind: {type: String, required: true}, // Sugar, Syrup, Cream
        option: {type: String, required: true}, // 2 spoons, vanilla, whole milk, etc.
        price: {type: Number, required: true, default: 0}
    }],
    possibleAddOns: [{
        kind: {type: String, required: true}, // Sugar, Syrup, Cream
        option: {type: String, required: true}, // 0 spoons, 1 spoon, 2 spoons, 3 spoons, vanilla, caramel, etc.
        price: {type: Number, required: true, default: 0}
    }],
    status: {type: String, required: true, default: "active"}, // active | paused
}, {
    timestamps: true
});

export default mongoose.model("Product", productSchema);
